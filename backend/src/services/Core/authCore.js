const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const AppError = require("../../utils/AppError");
const UserModel = require("../../Models/UserModel");
const VendorModel = require("../../Models/VendorModel");
const SessionModel = require("../../Models/SessionModel");
const OTPModel = require("../../Models/OTPModel");
const { setStandardDate } = require("../../utils/dateFormatter");
const { checkRole } = require("../../utils/checkvalidete");
const { sendOtpCore, verifyOtpCore } = require("./otpCore");
const sesstionHelper = require("../../utils/sessionHelper");
const { generateAuthTokens, verifyRefreshToken } = require("../../utils/jwtHelper");
exports.createAccountCore = async function (Body, role = "user", deviceInfo = {}) {
    const cleanEmail = Body.email.toLowerCase().trim();
    const mobileNumber = Body.phone_no || Body.mobileNumber;

    if (Body.password !== Body.passwordConfirm) {
        throw new AppError("Passwords do not match", 400);
    }

    await verifyOtpCore({
        email: cleanEmail,
        otp: Body.otp,
        purpose: "registration"
    });

    const actualRole = "user"; // Force all new registrations to be 'user'

    const rawDeviceType = deviceInfo.deviceType || deviceInfo.device_type || Body.device_type || "Desktop";
    const resolvedDeviceType = sesstionHelper.getDeviceType(rawDeviceType).toLowerCase();
    const isMobile = resolvedDeviceType === 'mobile' || resolvedDeviceType === 'tablet';

     //to check if vendor use web or not
    if (checkRole(role, ["vendor"]) && isMobile) {
        throw new AppError("Access Denied: Vendors must register via the Xenon Web Dashboard.", 403);
    }

    const existingUserByEmail = await UserModel.findOne({ email: cleanEmail });
    if (existingUserByEmail) throw new AppError("Account with this email already exists", 409);

    const existingUserByMobile = await UserModel.findOne({ mobileNumber: mobileNumber });
    if (existingUserByMobile) throw new AppError("Account with this mobile number already exists", 409);

    if (Body.DateOfBirth) {
        const dob = new Date(Body.DateOfBirth);
        const today = new Date();

        if (dob > today) {
            throw new AppError("Date of birth cannot be in the future", 400);
        }

        const hundredYearsAgo = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
        if (dob < hundredYearsAgo) {
            throw new AppError("Invalid date of birth. Please provide a valid date.", 400);
        }

        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

        if (dob > eighteenYearsAgo) {
            throw new AppError("Access Denied: You must be at least 18 years old to create an account on Xenon.", 403);
        }
    }

    const newUser = await UserModel.create({
        name: Body.name,
        email: cleanEmail,
        password: Body.password,
        role: actualRole,
        mobileNumber: mobileNumber,
        gender: Body.gender,
        DateOfBirth: Body.DateOfBirth ? (checkRole(role, ["vendor"]) ? setStandardDate(Body.DateOfBirth) : Body.DateOfBirth) : undefined
    });

    const tokens = generateAuthTokens(newUser._id, role, deviceInfo.familyId || deviceInfo.family_id);
    const hashedTokenId = crypto.createHash("sha256").update(tokens.tokenId).digest("hex");
    const deviceId = deviceInfo.deviceId || deviceInfo.device_id || crypto.randomBytes(8).toString("hex");

    await SessionModel.create({
        token_id: hashedTokenId,
        accessToken: crypto.createHash("sha256").update(tokens.accessToken).digest("hex"),
        refreshToken: crypto.createHash("sha256").update(tokens.refreshToken).digest("hex"),
        user_id: newUser._id,
        expires_at: sesstionHelper.calculateSessionExpiry(deviceInfo.expiresAt || deviceInfo.expires_at),
        ip_address: sesstionHelper.getClientIp(deviceInfo.ip_address || Body.ip_address || "127.0.0.1"),
        device_type: resolvedDeviceType, 
        device_id: sesstionHelper.getDeviceId(deviceInfo.device_id || deviceId),
        role: sesstionHelper.getRole(role),
        is_active: sesstionHelper.getIsActive(deviceInfo.isActive || deviceInfo.is_active),
        session_status: sesstionHelper.getSessionStatus(deviceInfo.sessionStatus || deviceInfo.session_status),
        family_id: sesstionHelper.getFamilyId(tokens.familyId)
    });

    return { user: newUser, vendor: newVendor, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
};

exports.loginCore = async function (email, password, roleExpected, deviceInfo = {}) {
    try {

        const rawDeviceType = deviceInfo.deviceType || deviceInfo.device_type || "Desktop";
        const resolvedDeviceType = sesstionHelper.getDeviceType(rawDeviceType).toLowerCase();
        const isMobile = resolvedDeviceType === 'mobile' || resolvedDeviceType === 'tablet';

        const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
        if (!user) throw new AppError("the account not founded", 401);

        if (roleExpected && !checkRole(user.role, [roleExpected])) {
            throw new AppError("You are not authorized to login to this portal", 403);
        }

        // Allow users to login on Web (they might be accessing the vendor onboarding form)
        if (checkRole(user.role, ["vendor", "admin"]) && isMobile) {
            throw new AppError("Access Denied: Vendors and Admins must login via the Xenon Web Dashboard.", 403);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new AppError("Invalid email or password", 401);

        if (user.deletionRequestedAt) {
            const timeSinceRequest = Date.now() - new Date(user.deletionRequestedAt).getTime();
            const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000;
            if (timeSinceRequest > thirtyDaysInMillis) {
                throw new AppError("Account is permanently deleted", 403);
            } else {
                throw new AppError("Account is pending deletion. Please restore your account to continue.", 403);
            }
        }

        if (user.isActive === false) throw new AppError("Your account has been blocked or deactivated", 403);

        const tokens = generateAuthTokens(user._id, user.role, deviceInfo.familyId || deviceInfo.family_id);
        const hashedTokenId = crypto.createHash("sha256").update(tokens.tokenId).digest("hex");
        const deviceId = deviceInfo.deviceId || deviceInfo.device_id || crypto.randomBytes(8).toString("hex");

        await SessionModel.create({
            token_id: hashedTokenId,
            accessToken: crypto.createHash("sha256").update(tokens.accessToken).digest("hex"),
            refreshToken: crypto.createHash("sha256").update(tokens.refreshToken).digest("hex"),
            user_id: user._id,
            expires_at: sesstionHelper.calculateSessionExpiry(deviceInfo.expiresAt || deviceInfo.expires_at),
            ip_address: sesstionHelper.getClientIp(deviceInfo.ip_address || "127.0.0.1"),
            device_type: resolvedDeviceType,
            device_id: sesstionHelper.getDeviceId(deviceInfo.device_id || deviceId),
            role: user.role,
            is_active: true,
            session_status: "active",
            family_id: tokens.familyId
        });

        return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    } catch (error) {
        if (error.statusCode) throw error;

        throw new AppError(error.message, 500);
    }
};
exports.logoutCore = async function (user, token) {
    try {
        if (!token) throw new AppError("Token is required for logout", 400);

        const hashedInputToken = crypto.createHash("sha256").update(token).digest("hex");

        const session = await SessionModel.findOneAndUpdate(
            { 
                user_id: user._id, 
                $or: [{ accessToken: hashedInputToken }, { refreshToken: hashedInputToken }],
                is_active: true 
            },
            { is_active: false },
            { new: true }
        );

        if (!session) throw new AppError("Active session not found or already logged out", 404);

        return { message: "Logout successful" };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.resetPasswordCore = async function (email, password, passwordConfirmation, token) {
    try {
        if (password !== passwordConfirmation) {
            throw new AppError("Passwords do not match", 400);
        }
        const cleanEmail = email.toLowerCase().trim();
        await verifyOtpCore({
            email: cleanEmail,
            otp: token,
            purpose: "password_reset"
        });

        const user = await UserModel.findOne({ email: cleanEmail });
        if (!user) throw new AppError("Account not found", 404);

        if (user.isActive === false) throw new AppError("Account has been blocked or deactivated", 403);

        user.password = password;
        await user.save();

        return { message: "Password reset successfully" };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.forgotPasswordCore = async function (email) {
    try {
        const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return { message: "If an account with that email exists, an OTP has been sent." };
        }

        if (user.isActive === false) throw new AppError("Account has been blocked or deactivated", 403);

        const otpResponse = await sendOtpCore({
            email: user.email,
            purpose: "password_reset",
            length: 6
        });

        return {
            message: "OTP sent to your email successfully",
            expiresAt: otpResponse.expiresAt
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.refreshTokenCore = async function (refreshToken, deviceInfo = {}) {
    try {
        if (!refreshToken) throw new AppError("Refresh token is required", 400);

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (err) {
            throw new AppError("Invalid or expired refresh token", 401);
        }

        const hashedTokenId = crypto.createHash("sha256").update(decoded.tokenId).digest("hex");

        const session = await SessionModel.findOne({ token_id: hashedTokenId, user_id: decoded.id });
        if (!session) {
            throw new AppError("Session not found. Please log in again.", 401);
        }
        if (!session.is_active) {
            throw new AppError("Session has been revoked. Please log in again.", 401);
        }

        const user = await UserModel.findById(decoded.id);
        if (!user || user.isActive === false) {
            throw new AppError("User account is disabled or does not exist", 401);
        }

        // Deactivate old session (Token Rotation)
        session.is_active = false;
        session.session_status = "refreshed";
        await session.save();

        const rawDeviceType = deviceInfo.deviceType || deviceInfo.device_type || "Desktop";
        const resolvedDeviceType = sesstionHelper.getDeviceType(rawDeviceType).toLowerCase();

        // Generate new tokens
        const tokens = generateAuthTokens(user._id, user.role, session.family_id);
        const newHashedTokenId = crypto.createHash("sha256").update(tokens.tokenId).digest("hex");
        const deviceId = deviceInfo.deviceId || deviceInfo.device_id || crypto.randomBytes(8).toString("hex");

        await SessionModel.create({
            token_id: newHashedTokenId,
            accessToken: crypto.createHash("sha256").update(tokens.accessToken).digest("hex"),
            refreshToken: crypto.createHash("sha256").update(tokens.refreshToken).digest("hex"),
            user_id: user._id,
            expires_at: sesstionHelper.calculateSessionExpiry(deviceInfo.expiresAt || deviceInfo.expires_at),
            ip_address: sesstionHelper.getClientIp(deviceInfo.ip_address || session.ip_address),
            device_type: resolvedDeviceType,
            device_id: sesstionHelper.getDeviceId(deviceInfo.device_id || deviceId),
            role: user.role,
            is_active: true,
            session_status: "active",
            family_id: tokens.familyId
        });

        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };

    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

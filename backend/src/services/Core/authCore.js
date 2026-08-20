const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const AppError = require("../../utils/AppError");
const UserModel = require("../../Models/UserModel");
const VendorModel = require("../../Models/VendorModel");
const SesstionModel = require("../../Models/SesstionModel");
const OTPModel = require("../../Models/OTPModel");
const { setStandardDate } = require("../../utils/dateFormatter");
const { checkRole } = require("../../utils/checkvalidete");
const { sendOtpCore, verifyOtpCore } = require("./otpCore");
const sesstionHelper = require("../../utils/sessionHelper");
const { generateAuthTokens, verifyRefreshToken } = require("../../utils/jwtHelper");
exports.createAccountCore = async function (Body, role = "user", deviceInfo = {}) {
    const cleanEmail = Body.email.toLowerCase().trim();
    const mobileNumber = Body.phone_no || Body.mobileNumber;

    const rawDeviceType = deviceInfo.deviceType || deviceInfo.device_type || Body.device_type || "Desktop";
    const resolvedDeviceType = sesstionHelper.getDeviceType(rawDeviceType).toLowerCase();
    const isMobile = resolvedDeviceType === 'mobile' || resolvedDeviceType === 'tablet';

    // if (checkRole(role, ["user"]) && !isMobile) {
    //     throw new AppError("Access Denied: Clients can only register via the Xenon Mobile App.", 403);

    // }
    // if (checkRole(role, ["vendor"]) && isMobile) {
    //     throw new AppError("Access Denied: Vendors must register via the Xenon Web Dashboard.", 403);
    // }

    const existingUserByEmail = await UserModel.findOne({ email: cleanEmail });
    if (existingUserByEmail) throw new AppError("Account with this email already exists", 409);

    const existingUserByMobile = await UserModel.findOne({ mobileNumber: mobileNumber });
    if (existingUserByMobile) throw new AppError("Account with this mobile number already exists", 409);

    if (checkRole(role, ["vendor"])) {
        const existingVendor = await VendorModel.findOne({ vendor_email: cleanEmail });
        if (existingVendor) throw new AppError("Vendor account with this email already exists", 409);
    }

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
        role: role,
        mobileNumber: mobileNumber,
        gender: Body.gender,
        DateOfBirth: Body.DateOfBirth ? (checkRole(role, ["vendor"]) ? setStandardDate(Body.DateOfBirth) : Body.DateOfBirth) : undefined
    });

    let newVendor = null;
    if (checkRole(role, ["vendor"])) {
        const createdVendor = await VendorModel.create({
            vendor_name: Body.company_name || Body.name,
            vendor_email: cleanEmail,
            vendor_password: Body.password,
            vendor_mobile: mobileNumber,
            vendor_address: Body.address,
            vendor_city: Body.city,
            vendor_state: Body.state,
            vendor_pincode: Body.pincode,
            vendor_country: Body.country,
            vendor_type: Body.vendor_type,
            vendor_owner_id: newUser._id,
            vendor_user_id: newUser._id
        });

        newVendor = await VendorModel.populate(createdVendor, [
            { path: "vendor_owner_id", select: "name" },
            { path: "vendor_user_id", select: "name" },
            { path: "_id", select: "company_name" }
        ]);
    }

    const tokens = generateAuthTokens(newUser._id, role, deviceInfo.familyId || deviceInfo.family_id);
    const hashedTokenId = crypto.createHash("sha256").update(tokens.tokenId).digest("hex");
    const deviceId = deviceInfo.deviceId || deviceInfo.device_id || crypto.randomBytes(8).toString("hex");

    await SesstionModel.create({
        token_id: hashedTokenId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user_id: newUser._id,
        expires_at: sesstionHelper.calculateSessionExpiry(deviceInfo.expiresAt || deviceInfo.expires_at),
        ip_address: sesstionHelper.getClientIp(deviceInfo.ipAddress || deviceInfo.ip_address || Body.ip_address || "127.0.0.1"),
        user_agent: sesstionHelper.getUserAgent(deviceInfo.userAgent || deviceInfo.user_agent || Body.user_agent || "Unknown"),
        device_type: resolvedDeviceType, // 🌟 نستخدم القيمة التي فحصناها في البداية
        os_name: sesstionHelper.getOsName(deviceInfo.osName || deviceInfo.os_name || Body.os_name || "Unknown"),
        browser_name: sesstionHelper.getBrowserName(deviceInfo.browserName || deviceInfo.browser_name || Body.browser_name || "Unknown"),
        device_id: sesstionHelper.getDeviceId(deviceId),
        role: sesstionHelper.getRole(role),
        is_active: sesstionHelper.getIsActive(deviceInfo.isActive || deviceInfo.is_active),
        sesstion_status: sesstionHelper.getSessionStatus(deviceInfo.sessionStatus || deviceInfo.sesstion_status),
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
        if (!user) throw new AppError("Invalid email or password", 401);

        if (roleExpected && !checkRole(user.role, [roleExpected])) {
            throw new AppError("You are not authorized to login to this portal", 403);
        }

        // if (checkRole(user.role, ["user"]) && !isMobile) {
        //     throw new AppError("Access Denied: Clients can only login via the Xenon Mobile App.", 403);
        // }
        // if (checkRole(user.role, ["vendor", "admin"]) && isMobile) {
        //     throw new AppError("Access Denied: Vendors and Admins must login via the Xenon Web Dashboard.", 403);
        // }

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

        await SesstionModel.create({
            token_id: hashedTokenId,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user_id: user._id,
            expires_at: sesstionHelper.calculateSessionExpiry(deviceInfo.expiresAt || deviceInfo.expires_at),
            ip_address: sesstionHelper.getClientIp(deviceInfo.ipAddress || deviceInfo.ip_address || "127.0.0.1"),
            user_agent: sesstionHelper.getUserAgent(deviceInfo.userAgent || "Unknown"),
            device_type: resolvedDeviceType,
            os_name: sesstionHelper.getOsName(deviceInfo.osName || "Unknown"),
            browser_name: sesstionHelper.getBrowserName(deviceInfo.browserName || "Unknown"),
            device_id: sesstionHelper.getDeviceId(deviceId),
            role: user.role,
            is_active: true,
            sesstion_status: "active",
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

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const session = await SesstionModel.findOneAndUpdate(
            { user_id: user._id, token_id: hashedToken, is_active: true },
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

        // 🌟 التحسين: استخدام دالة التحقق من الـ OTP النظيفة التي بنيناها (DRY Principle)
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

        if (checkRole(user.role, ["vendor"])) {
            const vendor = await VendorModel.findOne({ vendor_email: cleanEmail });
            if (vendor) {
                vendor.vendor_password = password;
                await vendor.save();
            }
        }

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

        const session = await SesstionModel.findOne({ token_id: hashedTokenId, user_id: decoded.id });
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
        session.sesstion_status = "refreshed";
        await session.save();

        const rawDeviceType = deviceInfo.deviceType || deviceInfo.device_type || "Desktop";
        const resolvedDeviceType = sesstionHelper.getDeviceType(rawDeviceType).toLowerCase();

        // Generate new tokens
        const tokens = generateAuthTokens(user._id, user.role, session.family_id);
        const newHashedTokenId = crypto.createHash("sha256").update(tokens.tokenId).digest("hex");
        const deviceId = deviceInfo.deviceId || deviceInfo.device_id || crypto.randomBytes(8).toString("hex");

        await SesstionModel.create({
            token_id: newHashedTokenId,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user_id: user._id,
            expires_at: sesstionHelper.calculateSessionExpiry(deviceInfo.expiresAt || deviceInfo.expires_at),
            ip_address: sesstionHelper.getClientIp(deviceInfo.ipAddress || deviceInfo.ip_address || session.ip_address),
            user_agent: sesstionHelper.getUserAgent(deviceInfo.userAgent || session.user_agent),
            device_type: resolvedDeviceType,
            os_name: sesstionHelper.getOsName(deviceInfo.osName || session.os_name),
            browser_name: sesstionHelper.getBrowserName(deviceInfo.browserName || session.browser_name),
            device_id: sesstionHelper.getDeviceId(deviceId),
            role: user.role,
            is_active: true,
            sesstion_status: "active",
            family_id: tokens.familyId
        });

        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };

    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

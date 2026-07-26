const AppError = require("../../../utils/AppError");
const bcrypt = require("bcrypt");
const UserModel = require("../../../Models/UserModel");
const VendorModel = require("../../../Models/VendorModel");
const SessionModel = require("../../../Models/SessionModel");
const authValidation = require("../../../validations/authValidation");
const mongoose = require("mongoose");
const crypto = require("crypto");

exports.createAccountCore = async function (authUser, Body, deviceInfo = {}) {
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
        if (authUser.role !== "vendor" && authUser.role !== "admin") {
            throw new AppError("You are not authorized to create an account", 403);
        }

        const userValidate = authValidation.createAccountValidation(Body);
        if (userValidate.error) {
            throw new AppError(userValidate.error.details.map(d => d.message).join(", "), 400);
        }

        const vendorValidate = authValidation.toVendorValidation(Body);
        if (vendorValidate.error) {
            throw new AppError(vendorValidate.error.details.map(d => d.message).join(", "), 400);
        }

        const [existingUser, existingVendor] = await Promise.all([
            UserModel.findOne({ email: Body.email }),
            VendorModel.findOne({ vendor_email: Body.email })
        ]);

        if (existingUser || existingVendor) {
            throw new AppError("Account with this email already exists", 409);
        }

        const passwordHash = await bcrypt.hash(Body.password, 12);

        const [newUser] = await UserModel.create([{
            name: Body.name,
            email: Body.email,
            password: passwordHash,
            role: Body.role,
            phone_no: Body.phone_no
        }], { session: dbSession });

        const [newVendor] = await VendorModel.create([{
            vendor_name: Body.company_name || Body.name,
            vendor_email: Body.email,
            vendor_password: passwordHash,
            vendor_phone_no: Body.phone_no || Body.mobile,
            vendor_address: Body.address,
            vendor_city: Body.city,
            vendor_state: Body.state,
            vendor_pincode: Body.pincode,
            vendor_country: Body.country,
            vendor_type: Body.vendor_type,
            vendor_owner_id: newUser._id,
            vendor_user_id: newUser._id
        }], { session: dbSession });

        const token = newUser.getJwtToken();
        const familyId = deviceInfo.familyId || deviceInfo.family_id || crypto.randomBytes(16).toString("hex");
        const deviceId = deviceInfo.deviceId || deviceInfo.device_id || crypto.randomBytes(8).toString("hex");
        
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const [userSession] = await SessionModel.create([{
            token_id: hashedToken,
            user_id: newUser._id,
            expires_at: deviceInfo.expiresAt || deviceInfo.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            ip_address: deviceInfo.ipAddress || deviceInfo.ip_address || Body.ip_address || "127.0.0.1",
            user_agent: deviceInfo.userAgent || deviceInfo.user_agent || Body.user_agent || "Unknown",
            device_type: deviceInfo.deviceType || deviceInfo.device_type || Body.device_type || "Desktop",
            os_name: deviceInfo.osName || deviceInfo.os_name || Body.os_name || "Unknown",
            browser_name: deviceInfo.browserName || deviceInfo.browser_name || Body.browser_name || "Unknown",
            device_id: deviceId,
            is_active: true,
            family_id: familyId
        }], { session: dbSession });

        await dbSession.commitTransaction();
        dbSession.endSession();

        return { newVendor, session: userSession, token };

    } catch (error) {
        await dbSession.abortTransaction();
        dbSession.endSession();

        if (error.statusCode) throw error;
        throw new AppError(error.message || "Failed to create account", 500);
    }
};

exports.loginVendorCore = async function (user, Body, deviceInfo = {}) {
    try {
        if (user.role !== "vendor") {
            throw new AppError("You are not authorized to login", 403);
        }

        const isPasswordValid = await bcrypt.compare(Body.password, user.password);
        if (!isPasswordValid) {
            throw new AppError("Invalid email or password", 401);
        }

        if (user.deletionRequestedAt) {
            const timeSinceRequest = Date.now() - new Date(user.deletionRequestedAt).getTime();
            const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000;

            if (timeSinceRequest > thirtyDaysInMillis) {
                throw new AppError("Account is permanently deleted", 403);
            } else {
                throw new AppError("Account is pending deletion. Please restore your account to continue.", 403);
            }
        }

        if (!user.isActive) {
            throw new AppError("Your account has been blocked or deactivated", 403);
        }

        const token = user.getJwtToken();

        const familyId = deviceInfo.familyId || deviceInfo.family_id || crypto.randomBytes(16).toString("hex");
        const deviceId = deviceInfo.deviceId || deviceInfo.device_id || crypto.randomBytes(8).toString("hex");

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const session = await SessionModel.create({
            token_id: hashedToken,
            user_id: user._id,
            expires_at: deviceInfo.expiresAt || deviceInfo.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            ip_address: deviceInfo.ipAddress || deviceInfo.ip_address || Body.ip_address || "127.0.0.1",
            user_agent: deviceInfo.userAgent || deviceInfo.user_agent || Body.user_agent || "Unknown",
            device_type: deviceInfo.deviceType || deviceInfo.device_type || Body.device_type || "Desktop",
            os_name: deviceInfo.osName || deviceInfo.os_name || Body.os_name || "Unknown",
            browser_name: deviceInfo.browserName || deviceInfo.browser_name || Body.browser_name || "Unknown",
            device_id: deviceId,
            is_active: true,
            family_id: familyId
        });

        return { token, session };

    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};

exports.logoutVendorCore = async function (user, body) {
    try {
        if (user.role !== "vendor") {
            throw AppError.forbidden("You are not authorized to logout from this portal");
        }

        // فحص الـ Body (يفترض إرسال token أو refreshToken)
        const validation = authValidation.logoutVendorValidation(body);
        if (validation.error) {
            throw AppError.badRequest(validation.error.details.map(d => d.message).join(", "));
        }

        // تشفير الـ Token القادم في الـ Body لمطابقته مع المشفّر في الداتابيز
        const hashedToken = crypto.createHash("sha256").update(body.token).digest("hex");

        // إلغاء تفعيل الجلسة الحالية المحددة (Soft Delete)
        const session = await SessionModel.findOneAndUpdate(
            { user_id: user._id, token_id: hashedToken, is_active: true },
            { is_active: false },
            { new: true }
        );

        // إذا أردت الحذف النهائي بدلاً من إلغاء التفعيل:
        //const session = await SessionModel.findOneAndUpdate({ user_id: user._id, token_id: hashedToken }, { is_active: false });

        if (!session) {
            throw AppError.notFound("Active session not found or already logged out");
        }

        return { session };

    } catch (error) {
        if (error.statusCode) throw error;
        throw AppError.internal(error.message || "Internal Server Error");
    }
};

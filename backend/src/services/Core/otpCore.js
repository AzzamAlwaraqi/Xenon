const OTPModel = require("../../Models/OTPModel");
const AppError = require('../../utils/AppError');
const generateOTP = require('../../utils/generateOTP'); // 🌟 الاستدعاء الاحترافي من الـ utils
const emailService = require("../Integration/emailService"); 

// ==========================================
// 1. CORE: Send OTP 
// ==========================================
exports.sendOtpCore = async function ({ email, phone, purpose = "registration", length = 6 }) {
    if (!email && !phone) throw new AppError("Email or phone must be provided", 400);

    const cleanEmail = email ? String(email).toLowerCase().trim() : undefined;
    const cleanPhone = phone ? String(phone).trim() : undefined;
    
    const otp = generateOTP(length); // 🌟 استخدام الـ utility هنا
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 

    const query = cleanEmail ? { email: cleanEmail, purpose } : { phone: cleanPhone, purpose };
    await OTPModel.deleteMany(query);

    await OTPModel.create({
        email: cleanEmail,
        phone: cleanPhone,
        otp,
        purpose,
        expiresAt
    });

    if (cleanEmail) {
        const subject = `Your OTP Code - ${purpose.toUpperCase()}`;
        const text = `Your Xenon OTP code is: ${otp}. It will expire in 5 minutes.`;
        await emailService.sendEmail({ to: cleanEmail, subject, text });
    }

    return {
        success: true,
        expiresAt,
        otp: process.env.NODE_ENV === "development" ? otp : undefined 
    };
};

// ==========================================
// 2. CORE: Verify OTP 
// ==========================================
exports.verifyOtpCore = async function ({ email, phone, otp, purpose = "registration" }) {
    if (!email && !phone) throw new AppError("Email or phone must be provided", 400);
    if (!otp) throw new AppError("OTP code is required", 400);

    const cleanEmail = email ? String(email).toLowerCase().trim() : undefined;
    const cleanPhone = phone ? String(phone).trim() : undefined;
    const query = cleanEmail ? { email: cleanEmail, purpose } : { phone: cleanPhone, purpose };

    const otpRecord = await OTPModel.findOne(query).sort({ createdAt: -1 });

    if (!otpRecord) throw new AppError("No active OTP code found", 404);
    if (otpRecord.verifiedAt) throw new AppError("OTP already verified", 400);
    if (otpRecord.expiresAt < new Date()) throw new AppError("OTP expired", 400);

    const maxAttempts = 5;
    if (otpRecord.attempts >= maxAttempts) {
        await OTPModel.deleteOne({ _id: otpRecord._id });
        throw new AppError("Too many failed attempts. Please request a new OTP", 400);
    }

    if (otpRecord.otp !== String(otp).trim()) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remaining = maxAttempts - otpRecord.attempts;
        throw new AppError(`Invalid OTP. You have ${remaining} attempts remaining`, 400);
    }

    otpRecord.verifiedAt = new Date();
    await otpRecord.save();

    return otpRecord;
};
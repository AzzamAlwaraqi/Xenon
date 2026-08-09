const crypto = require("crypto");
const OTPModel = require("../Models/OTPModel");
const AppError = require("./AppError");
const emailService = require("../services/Integration/emailService");

// Mock Provider (Console logger for dev/unit testing)
const mockProvider = {
    sendEmail: async (email, otp, purpose) => {
        console.log(`[Mock OTP Provider] Sending Email to ${email} for purpose "${purpose}". OTP Code: ${otp}`);
        return { success: true, message: `Email OTP logged to console` };
    }
};

// Real Email Provider (Production / QC Environment)
const emailProvider = {
    sendEmail: async (email, otp, purpose) => {
        const subject = `Your OTP Code - ${purpose.toUpperCase()}`;
        const text = `Your Xenon OTP code is: ${otp}. It will expire in 5 minutes.`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #007bff;">Xenon Verification</h2>
                <p>Thank you for registering with Xenon. Your OTP verification code is:</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #007bff;">${otp}</span>
                </div>
                <p>This code is valid for <strong>5 minutes</strong>.</p>
                <p style="font-size: 12px; color: #777;">If you did not request this, please ignore this email.</p>
            </div>
        `;

        // Correct parameter mapping for emailService.sendEmail
        return await emailService.sendEmail({
            to: email,
            subject,
            text,
            html
        });
    }
};

/**
 * Generate a cryptographically secure numeric OTP
 */
const generateOTP = (length = 6) => {
    if (length < 4 || length > 10) {
        throw new Error("OTP length must be between 4 and 10 digits");
    }
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max).toString();
};

/**
 * Generate, save, and send an OTP via email
 */
exports.sendOTP = async ({
    email,
    purpose = "registration",
    provider = process.env.OTP_PROVIDER || "email",
    length = 6
}) => {
    if (!email) {
        throw new AppError("Email must be provided to send OTP", 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const otp = generateOTP(length);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Delete any active OTPs for the same email and purpose
    await OTPModel.deleteMany({ email: cleanEmail, purpose });

    // Save the new OTP to DB
    await OTPModel.create({
        email: cleanEmail,
        otp,
        purpose,
        expiresAt
    });

    let sendResult;
    if (provider === "mock") {
        sendResult = await mockProvider.sendEmail(cleanEmail, otp, purpose);
    } else if (provider === "email") {
        sendResult = await emailProvider.sendEmail(cleanEmail, otp, purpose);
    } else {
        throw new AppError(`Unsupported OTP provider: ${provider}`, 400);
    }

    return {
        success: true,
        message: "OTP sent successfully",
        expiresAt,
        // Hide the plain text OTP code in production and QC environments
        otp: (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "qc") ? otp : undefined,
        providerResult: sendResult
    };
};

/**
 * Verify an OTP
 */
exports.verifyOTP = async ({ email, otp, purpose = "registration" }) => {
    if (!email) {
        throw new AppError("Email must be provided to verify OTP", 400);
    }
    if (!otp) {
        throw new AppError("OTP code is required for verification", 400);
    }

    const cleanEmail = email.toLowerCase().trim();

    const otpRecord = await OTPModel.findOne({
        email: cleanEmail,
        purpose
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
        throw new AppError("No active OTP code found for this account", 404);
    }

    if (otpRecord.verifiedAt) {
        throw new AppError("OTP code has already been verified", 400);
    }

    if (otpRecord.expiresAt && otpRecord.expiresAt < new Date()) {
        throw new AppError("OTP code has expired. Please request a new one", 400);
    }

    const maxAttempts = 5;
    if (otpRecord.attempts >= maxAttempts) {
        await OTPModel.deleteOne({ _id: otpRecord._id });
        throw new AppError("Too many failed attempts. Please request a new OTP code", 400);
    }

    if (otpRecord.otp !== otp.toString().trim()) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        const remaining = maxAttempts - otpRecord.attempts;
        throw new AppError(`Invalid OTP code. You have ${remaining} attempts remaining`, 400);
    }

    // Mark OTP as verified
    otpRecord.verifiedAt = new Date();
    await otpRecord.save();

    return true;
};
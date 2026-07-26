const crypto = require("crypto");
const OTPModel = require("../Models/OTPModel");
const AppError = require("./AppError");
const emailService = require("../services/Integration/emailService");

// Mock Provider - logs to console (if provider is set to 'mock')
const mockProvider = {
    sendEmail: async (email, otp, purpose) => {
        console.log(`[Mock OTP Provider] Sending Email to ${email} for purpose "${purpose}". OTP Code: ${otp}`);
        return { success: true, message: `Email OTP logged to console` };
    }
};

// Email Provider - sends email using emailService (with real nodemailer / SMTP under the hood)
const emailProvider = {
    sendEmail: async (email, otp, purpose) => {
        const subject = `Your OTP Code - ${purpose.toUpperCase()}`;
        const message = `Your Xenon OTP code is: ${otp}. It will expire in 5 minutes.`;
        const html = `<p>Your Xenon OTP code is: <strong>${otp}</strong>.</p><p>It will expire in 5 minutes.</p>`;
        
        return await emailService.sendEmail({ email, subject, message, html });
    }
};

/**
 * Generate a cryptographically secure numeric OTP
 * @param {number} length 
 * @returns {string}
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
 * @param {Object} options
 * @param {string} options.email
 * @param {string} [options.purpose]
 * @param {string} [options.provider] - 'email' or 'mock'
 * @param {number} [options.length]
 * @returns {Promise<Object>}
 */
exports.sendOTP = async ({ email, purpose = "verification", provider = "email", length = 6 }) => {
    if (!email) {
        throw new AppError("Email must be provided to send OTP", 400);
    }

    const otp = generateOTP(length);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Delete any active OTPs for the same target and purpose
    await OTPModel.deleteMany({ email: email.toLowerCase().trim(), purpose });

    // Save the new OTP to database
    await OTPModel.create({
        email: email.toLowerCase().trim(),
        otp,
        purpose,
        expiresAt
    });

    let sendResult;
    // Route to appropriate provider
    if (provider === "mock") {
        sendResult = await mockProvider.sendEmail(email, otp, purpose);
    } else if (provider === "email") {
        sendResult = await emailProvider.sendEmail(email, otp, purpose);
    } else {
        throw new AppError(`Unsupported OTP provider: ${provider}`, 400);
    }

    return {
        success: true,
        message: "OTP sent successfully",
        expiresAt,
        otp: process.env.NODE_ENV !== "production" ? otp : undefined,
        providerResult: sendResult
    };
};

/**
 * Verify an OTP
 * @param {Object} options
 * @param {string} options.email
 * @param {string} options.otp
 * @param {string} [options.purpose]
 * @returns {Promise<boolean>}
 */
exports.verifyOTP = async ({ email, otp, purpose = "verification" }) => {
    if (!email) {
        throw new AppError("Email must be provided to verify OTP", 400);
    }
    if (!otp) {
        throw new AppError("OTP code is required for verification", 400);
    }

    // Find the latest active (unverified) OTP record for this email and purpose
    const otpRecord = await OTPModel.findOne({
        email: email.toLowerCase().trim(),
        purpose
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
        throw new AppError("No OTP code request found for this account", 404);
    }

    if (otpRecord.verifiedAt) {
        throw new AppError("OTP code has already been verified", 400);
    }

    // Check expiration
    if (otpRecord.expiresAt && otpRecord.expiresAt < new Date()) {
        throw new AppError("OTP code has expired. Please request a new one", 400);
    }

    // Check attempts limit (e.g. max 5 attempts)
    const maxAttempts = 5;
    if (otpRecord.attempts >= maxAttempts) {
        await OTPModel.deleteOne({ _id: otpRecord._id });
        throw new AppError("Too many failed attempts. Please request a new OTP code", 400);
    }

    // Validate the OTP code
    if (otpRecord.otp !== otp.trim()) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        
        const remaining = maxAttempts - otpRecord.attempts;
        throw new AppError(`Invalid OTP code. You have ${remaining} attempts remaining`, 400);
    }

    // Success - mark as verified and save
    otpRecord.verifiedAt = new Date();
    await otpRecord.save();

    return true;
};

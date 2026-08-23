const OTPModel = require("../../Models/OTPModel");
const AppError = require('../../utils/AppError');
const generateOTP = require('../../utils/generateOTP');
const emailService = require("../Integration/emailService");
const bcrypt = require('bcrypt');


exports.sendOtpCore = async function ({ email, phone, purpose = "registration", length = 6 }) {
    if (!email && !phone) throw new AppError("Email or phone must be provided", 400);

    const cleanEmail = email ? String(email).toLowerCase().trim() : undefined;
    const cleanPhone = phone ? String(phone).trim() : undefined;

    const otp = generateOTP(length);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const hashedOtp = await bcrypt.hash(otp, 8);

    await OTPModel.create({
        email: cleanEmail,
        phone: cleanPhone,
        otp: hashedOtp,
        purpose,
        expiresAt
    });

    if (cleanEmail) {
        let subject, headerTitle, subtitle, actionText, iconColor;

        if (purpose === 'password_reset') {
            subject = 'Reset Your Xenon Password';
            headerTitle = 'Password Reset';
            subtitle = 'Secure your Xenon account';
            actionText = 'Enter the code below to reset your password. If you did not request this, please ignore this email.';
            iconColor = 'linear-gradient(135deg, #ef4444, #b91c1c)'; // Red for reset
        } else {
            subject = 'Verify Your Xenon Account';
            headerTitle = 'Verify your identity';
            subtitle = 'Smart Tourism & Travel Platform';
            actionText = 'Enter the code below to complete your registration. This helps us keep your account secure.';
            iconColor = 'linear-gradient(135deg, #4f46e5, #7c3aed)'; // Purple/Blue for registration
        }

        const text = `Your Xenon OTP code is: ${otp}. It will expire in 5 minutes.`;

        const html = `
        <!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xenon Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f3f4f6; padding: 48px 0;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
                    
                    <!-- Top accent bar -->
                    <tr>
                        <td style="height: 6px; background: ${iconColor}; font-size: 0; line-height: 0;">&nbsp;</td>
                    </tr>

                    <!-- Header / Brand -->
                    <tr>
                        <td style="padding: 40px 40px 8px 40px; text-align: center;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto;">
                                <tr>
                                    <td style="width: 48px; height: 48px; background: ${iconColor}; border-radius: 12px; text-align: center; vertical-align: middle;">
                                        <span style="color: #ffffff; font-size: 24px; font-weight: 800; line-height: 48px;">X</span>
                                    </td>
                                </tr>
                            </table>
                            <h1 style="color: #111827; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">XENON</h1>
                            <p style="color: #6b7280; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 6px; margin-bottom: 0;">${subtitle}</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 24px 40px 8px 40px; text-align: center;">
                            <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">${headerTitle}</h2>
                            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                                ${actionText}
                            </p>

                            <!-- OTP Box -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 32px 24px;">
                                        <p style="color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 12px 0;">Your Verification Code</p>
                                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; color: #0f172a; letter-spacing: 12px; display: inline-block; padding-left: 12px;">${otp}</span>
                                    </td>
                                </tr>
                            </table>

                            <!-- Expiry + copy hint -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 24px auto 0 auto;">
                                <tr>
                                    <td style="background-color: #fef2f2; border-radius: 20px; padding: 8px 16px; border: 1px solid #fee2e2;">
                                        <span style="color: #dc2626; font-size: 13px; font-weight: 600;">⏰ Code expires in 5 minutes</span>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                                For your security, never share this code with anyone — including Xenon staff.
                            </p>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 32px 40px 0 40px;">
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px 36px 40px; text-align: center;">
                            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
                                Didn't request this code? You can safely ignore this email — no action is needed and your account remains secure.
                            </p>
                            <p style="color: #d1d5db; font-size: 12px; margin: 16px 0 0 0;">
                                &copy; ${new Date().getFullYear()} Xenon Platform. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        await emailService.sendEmail({ to: cleanEmail, subject, text, html });
    }

    return {
        success: true,
        expiresAt,
        otp: process.env.NODE_ENV === "development" ? otp : undefined
    };
};

exports.verifyOtpCore = async function ({ email, phone, otp, purpose = "registration" }) {
    if (!email && !phone) throw new AppError("Email or phone must be provided", 400);
    if (!otp) throw new AppError("OTP code is required", 400);

    const cleanEmail = email ? String(email).toLowerCase().trim() : undefined;
    const cleanPhone = phone ? String(phone).trim() : undefined;

    // 🌟 إضافة شرط للتأكد من أننا لا نجلب OTP تم إيقافه مسبقاً (isDeleted)
    const query = cleanEmail
        ? { email: cleanEmail, purpose, isDeleted: { $ne: true } }
        : { phone: cleanPhone, purpose, isDeleted: { $ne: true } };

    // 1. جلب السجل أولاً
    const otpRecord = await OTPModel.findOne(query).sort({ createdAt: -1 });

    if (!otpRecord) throw new AppError("No active OTP code found", 404);
    if (otpRecord.verifiedAt) throw new AppError("OTP already verified", 400);
    if (otpRecord.expiresAt < new Date()) throw new AppError("OTP expired", 400);

    // 2. التحقق من عدد المحاولات قبل فحص الباسوورد
    const maxAttempts = 5;
    if (otpRecord.attempts >= maxAttempts) {
        otpRecord.isDeleted = true;
        otpRecord.isActive = false;
        otpRecord.expiresAt = new Date();
        otpRecord.deletionRequestedAt = new Date();
        await otpRecord.save();
        throw new AppError("Too many failed attempts. Please request a new OTP", 400);
    }

    // 🌟 3. السحر المعماري: فحص وتشفير الـ OTP في المكان الصحيح (بعد جلب السجل)
    const isOtpValid = await bcrypt.compare(String(otp).trim(), otpRecord.otp);

    if (!isOtpValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remaining = maxAttempts - otpRecord.attempts;
        throw new AppError(`Invalid OTP. You have ${remaining} attempts remaining`, 400);
    }

    // 4. إذا وصلنا هنا، يعني أن الـ OTP صحيح تماماً
    otpRecord.verifiedAt = new Date();
    await otpRecord.save();

    return otpRecord;
};
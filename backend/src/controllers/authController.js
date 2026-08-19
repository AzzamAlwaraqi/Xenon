const authCore = require("../services/Core/authCore");
const  AppError  = require("../utils/AppError");
const { sendOtpCore, verifyOtpCore } = require("../services/Core/otpCore");
const UserModel = require("../Models/UserModel");
const { checkRole } = require("../utils/checkvalidete");
const authValidation = require("../validations/authValidation");

exports.register = async (req, res, next) => {
    try {
        const role = req.body.role === "vendor" ? "vendor" : "user";
        const validationFunction = role === "vendor" ? authValidation.createAccountValidation : authValidation.createClientValidation;
        
        const { error, value } = validationFunction(req.body);
        if (error) {
            return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        }
        req.body = value;

        const result = await authCore.createAccountCore(req.body, role, req.deviceInfo || {});

        if (role === "user") {
            let otpResponse;
            try {
                otpResponse = await sendOtpCore({
                    email: result.user.email,
                    purpose: "registration",
                    length: 6
                });
            } catch (otpErr) {
                console.error('❌ OTP send failed:', otpErr.message);
                await UserModel.findByIdAndDelete(result.user._id);
                return next(new AppError('Registration failed: could not send verification email. Please try again.', 500));
            }

            return res.status(201).json({
                status: "success",
                message: "Account created successfully. A verification OTP has been sent to your email address.",
                data: {
                    user: {
                        id: result.user._id,
                        name: result.user.name,
                        email: result.user.email
                    },
                    token: result.token,
                   // session: result.session,
                    otpInfo: {
                        expiresAt: otpResponse.expiresAt
                    }
                }
            });
        } else {
            return res.status(201).json({
                status: "success",
                message: "Vendor account created successfully",
                data: {
                    newVendor: result.vendor,
                    session: result.session,
                    token: result.token
                }
            });
        }
    } catch (err) {
        next(new AppError(err.message, err.statusCode || 500));
    }
};

exports.login = async (req, res, next) => {
    try {
        const { error, value } = authValidation.loginAccountValidation(req.body);
        if (error) {
            return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        }
        req.body = value;

        const role = req.body.role;
        if (role) {
            const isValidRole = checkRole(role);
            if (!isValidRole) {
                return next(new AppError("Invalid role specified", 400));
            }
        }
        
        const result = await authCore.loginCore(req.body.email, req.body.password, role, req.deviceInfo || {});

        res.status(200).json({
            status: "success",
            message: "Login successful",
            data: {
                session: result.session,
                token: result.token,
                user: result.user.role === "user" ? result.user : undefined 
            }
        });
    } catch (error) {
        next(new AppError(error.message, error.statusCode || 400));
    }
};

exports.logout = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return next(new AppError("User not authenticated", 401));

        const token = req.headers.authorization && req.headers.authorization.startsWith("Bearer")
            ? req.headers.authorization.split(" ")[1]
            : req.body.token;

        await authCore.logoutCore(user, token);
        res.clearCookie("token");

        res.status(200).json({
            status: "success",
            message: "Logout successful"
        });
    } catch (error) {
        next(new AppError(error.message, error.statusCode || 400));
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { error, value } = authValidation.resetPasswordValidation(req.body);
        if (error) {
            return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        }
        req.body = value;

        const { email, password, token, otpCode } = req.body;
        const resetToken = token || otpCode;
        
        if (!email || !password || !resetToken) {
            return next(new AppError("Email, password, and token/otpCode are required", 400));
        }

        const result = await authCore.resetPasswordCore(email, password, resetToken);
        res.status(200).json({
            status: "success",
            message: result.message
        });
    } catch (error) {
        next(new AppError(error.message, error.statusCode || 500));
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { error, value } = authValidation.forgotPasswordValidation(req.body);
        if (error) {
            return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        }
        req.body = value;

        const { email } = req.body;
        
        if (!email) {
            return next(new AppError("Email is required", 400));
        }

        const result = await authCore.forgotPasswordCore(email);
        res.status(200).json({
            status: "success",
            message: result.message,
            data: result.expiresAt ? { expiresAt: result.expiresAt } : undefined
        });
    } catch (error) {
        next(new AppError(error.message, error.statusCode || 500));
    }
};

exports.verifyOtp = async (req, res, next) => {
   try { // 1. Extract email and otp from request body
    const { email, otp, purpose } = req.body;

    if (!email || !otp) {
        return next(new AppError('Please provide both email and OTP code', 400));
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const verificationPurpose = purpose || 'registration';

    // 2. Pass pure data to the Core layer for validation (handles expiration, attempts, etc.)
    await verifyOtpCore({
        email: cleanEmail,
        otp,
        purpose: verificationPurpose
    });

    // 3. Business Logic: If verification succeeds and purpose is registration, activate the user
    if (verificationPurpose === 'registration') {
        const user = await UserModel.findOneAndUpdate(
            { email: cleanEmail },
            { isEmailVerified: true, isActive: true }, // Activate user account
            { new: true }
        );

        if (!user) {
            return next(new AppError('User not found associated with this email', 404));
        }
    }

    // 4. Send success response back to the client
    res.status(200).json({
        status: 'success',
        message: 'Email verified successfully. Your account is now active.'
    });
    } catch (error) {
        next(new AppError(error.message, error.statusCode || 500));
    }
};

exports.sendOtp = async (req, res, next) => {
    try {
        const { email, purpose } = req.body;
        
        if (!email) {
            return next(new AppError('Please provide an email', 400));
        }

        const otpResponse = await sendOtpCore({
            email,
            purpose: purpose || 'registration',
            length: 6
        });

        res.status(200).json({
            status: 'success',
            message: 'OTP sent successfully to your email.',
            data: {
                expiresAt: otpResponse.expiresAt
            }
        });
    } catch (error) {
        next(new AppError(error.message, error.statusCode || 500));
    }
};
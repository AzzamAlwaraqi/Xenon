const authCore = require("../services/Core/authCore");
const AppError = require("../utils/AppError");
const joi = require("joi");
const { sendOTP } = require("../utils/OTPService");
const UserModel = require("../Models/UserModel");
const checkRole = require("../utils/checkRole");

exports.register = async (req, res, next) => {
    try {
        const role = req.body.role === "vendor" ? "vendor" : "user";
        const result = await authCore.createAccountCore(req.body, role, req.deviceInfo || {});

        if (role === "user") {
            let otpResponse;
            try {
                otpResponse = await sendOTP({
                    email: result.user.email,
                    purpose: "registration",
                    provider: process.env.OTP_PROVIDER || "email",
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
                        email: result.user.email,
                        isEmailVerified: result.user.isEmailVerified
                    },
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

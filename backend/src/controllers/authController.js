const authCore = require("../services/Core/authCore");
const { sendOtpCore, verifyOtpCore } = require("../services/Core/otpCore");
const UserModel = require("../Models/UserModel");
const {checkRole} = require("../utils/checkvalidete");
const sessionHelper = require("../utils/sessionHelper");

exports.register = async (req, res, next) => {
    try {
        const role = req.body.role; 
        
        const deviceInfo = sessionHelper.extractAndValidateSessionData(req, role);
        const result = await authCore.createAccountCore(req.body, role, deviceInfo);

        if (checkRole( role ,["user"])) {
            return res.status(201).json({
                status: "success",
                message: "Account created successfully.",
                data: {
                    user: {
                        id: result.user._id,
                        name: result.user.name,
                        email: result.user.email
                    },
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken
                }
            });
        } 
        
        return res.status(201).json({
            status: "success",
            message: "Vendor account created successfully",
            data: {
                newVendor: result.vendor,
                session: result.session,
                token: result.accessToken,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
            }
        });
    } catch (err) {
        next(err);
    }
};
exports.login = async (req, res, next) => {
    try {
        const role = req.body.role;
        
        const deviceInfo = sessionHelper.extractAndValidateSessionData(req, role);

        const result = await authCore.loginCore(
            req.body.email, 
            req.body.password, 
            role, 
            deviceInfo 
        );

        res.status(200).json({
            status: "success",
            message: "Login successful",
            data: {
                session: result.session,
                token: result.accessToken,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user.role === "user" ? result.user : undefined 
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.logout = async (req, res, next) => {
    try {
        const token = req.headers.authorization && req.headers.authorization.startsWith("Bearer")
            ? req.headers.authorization.split(" ")[1]
            : req.body.token;

        await authCore.logoutCore(req.user, token);
        res.clearCookie("token");

        res.status(200).json({
            status: "success",
            message: "Logout successful"
        });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { email, password, token, otpCode, confirm_password } = req.body;
        const resetToken = token || otpCode; 
        
        const result = await authCore.resetPasswordCore(email, password, confirm_password, resetToken);
        
        res.status(200).json({
            status: "success",
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const result = await authCore.forgotPasswordCore(req.body.email);
        
        res.status(200).json({
            status: "success",
            message: result.message,
            data: result.expiresAt ? { expiresAt: result.expiresAt } : undefined
        });
    } catch (error) {
        next(error);
    }
};

exports.verifyOtp = async (req, res, next) => {
   try { 
        const { email, otp, purpose } = req.body;
        const verificationPurpose = purpose || 'registration';

        await verifyOtpCore({
            email: email, 
            otp: otp,
            purpose: verificationPurpose
        });

        if (verificationPurpose === 'registration') {
            await UserModel.findOneAndUpdate(
                { email: email },
                { isEmailVerified: true, isActive: true }, 
                { new: true }
            );
        }

        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully. Your account is now active.'
        });
    } catch (error) {
        next(error);
    }
};

exports.sendOtp = async (req, res, next) => {
    try {
        const otpResponse = await sendOtpCore({
            email: req.body.email,
            phone: req.body.phone,
            purpose: req.body.purpose || 'registration',
            length: 6
        });

        res.status(200).json({
            status: 'success',
            message: 'OTP sent successfully to your contact.',
            data: {
                expiresAt: otpResponse.expiresAt
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        
        const deviceInfo = sessionHelper.extractAndValidateSessionData(req);
        const result = await authCore.refreshTokenCore(refreshToken, deviceInfo);

        res.status(200).json({
            status: "success",
            message: "Token refreshed successfully",
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};
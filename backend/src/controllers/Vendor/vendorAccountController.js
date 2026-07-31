const { createAccountCore, loginVendorCore, logoutVendorCore } = require("../../services/Core/Vendor/vendorAccountCore");
const authValidation = require("../../validations/authValidation");
const UserModel = require("../../Models/UserModel");
const AppError = require("../../utils/AppError");

exports.createAccount = async (req, res, next) => {
    try {
        const validation = authValidation.createAccountValidation(req.body);
        if (validation.error) {
            return res.AppError(validation.error.details.map(d => d.message).join(", "), 400);
        }

        const authUser = req.user || {};
        const vendor = await createAccountCore(authUser, req.body, req.deviceInfo || {});

        res.status(201).json({
            status: "success",
            data: {
                newVendor: vendor.newVendor,
                session: vendor.session,
                token: vendor.token,
                message: "Vendor account created successfully",
            }
        });
    } catch (error) {
        return res.AppError(error.message, error.statusCode || 500);
    }
};

exports.loginVendor = async (req, res, next) => {
    try {
        const validation = authValidation.loginAccountValidation(req.body);
        if (validation.error) {
            return res.AppError(validation.error.details.map(d => d.message).join(", "), 400);
        }

        const user = await UserModel.findOne({ email: req.body.email });
        if (!user) {
            return res.AppError("Invalid email or password", 401);
        }

        const vendor = await loginVendorCore(user, req.body, req.deviceInfo || {});

        res.status(200).json({
            status: "success",
            data: {
                session: vendor.session,
                token: vendor.token,
                message: "Vendor account logged in successfully",
            }
        });
    } catch (error) {
        return res.AppError(error.message, error.statusCode || 500);
    }
};

exports.logoutVendor = async (req, res, next) => {
    try {
        const validation = authValidation.logoutVendorValidation(req.body);
        if (validation.error) {
            return res.AppError(validation.error.details.map(d => d.message).join(", "));
        }

        const user = req.user;
        if (!user) {
            return res.AppError("User not authenticated");
        }

        const token = req.headers.authorization && req.headers.authorization.startsWith("Bearer")
            ? req.headers.authorization.split(" ")[1]
            : req.body.token;

        const vendor = await logoutVendorCore(user, { ...req.body, token });

        res.status(200).json({
            status: "success",
            data: {
                session: vendor.session,
                message: "Vendor account logged out successfully"
            }
        });
    } catch (error) {
        return res.AppError(error.message, error.statusCode || 500);
    }
};
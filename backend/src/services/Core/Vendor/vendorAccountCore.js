const AppError = require("../../../utils/AppError");
const bcrypt = require("bcrypt");
const VendorModel = require("../../../Models/VendorModel");
const authValidation = require("../../../validations/authValidation");
exports.createAccount = async function (user, Body) {
    try {
        const { name, email, password, role, file } = user;
        if (role !== "vendor") {
            throw new AppError("You are not authorized to create an account", 403);
        }
        const uservalidate = authValidation.createAccountValidation(Body);
        if (uservalidate.error) {
            throw new AppError(uservalidate.error.details[0].message, 400);
        }
        const toVendorValidation = authValidation.toVendorValidation(Body);
        if (toVendorValidation.error) {
            throw new AppError(toVendorValidation.error.details[0].message, 400);
        }
        const passwordHash = await bcrypt.hash(Body.password, 12);
        
       
        return vendor;
    }
    catch (error) {
        throw new AppError(error.message, 400);
    }
}
exports.loginVendorCore = async function (user, Body) {
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
        return token;

    } catch (error) {
        if (error.statusCode) {
            throw error;
        }
        throw new AppError(error.message || "Internal Server Error", 500);
    }
}
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const AppError = require("../../utils/AppError");
const VendorModel = require("../../../Models/VendorModel");
const UserModel = require("../../../Models/UserModel");
const OTPModel = require("../../../Models/OTPModel");
const vendorCore = require("./vendorAccountCore");
const authValidation = require("../../../validations/authValidation");
exports.getVendorCore = async function (vendorId) {
    try {
        const vendor = await VendorModel.findById(vendorId).select("name email role vendor_role vendor_mobile vendor_address vendor_city vendor_state vendor_pincode vendor_country is_Active");
        if (!vendor) {
            throw new AppError("Vendor not found", 404);
        }

        return vendor;

    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};

exports.resetPasswordVendorCore = async function (Body) {
    const { email, password, token } = Body;

    // 1. Verify the OTP/token
    const otpRecord = await OTPModel.findOne({ email, otp: token });
    if (!otpRecord) {
        throw new AppError("Invalid token or OTP", 400);
    }
    if (otpRecord.expiresAt && otpRecord.expiresAt < new Date()) {
        throw new AppError("Token or OTP has expired", 400);
    }

    // 2. Find the user and vendor
    const [user, vendor] = await Promise.all([
        UserModel.findOne({ email, role: "vendor" }),
        VendorModel.findOne({ vendor_email: email })
    ]);

    if (!user || !vendor) {
        throw new AppError("Vendor account not found", 404);
    }

    if (!user.isActive || !vendor.is_Active) {
        throw new AppError("Account has been blocked or deactivated", 403);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();
    try {
        user.password = hashedPassword;
        await user.save({ session: dbSession });

        vendor.vendor_password = hashedPassword;
        await vendor.save({ session: dbSession });
        await OTPModel.deleteOne({ _id: otpRecord._id }, { session: dbSession });

        await dbSession.commitTransaction();
        dbSession.endSession();
    } catch (error) {
        await dbSession.abortTransaction();
        dbSession.endSession();
        throw error;
    }

    return { message: "Password reset successfully" };
};

exports.updateProfileVendorCore = async function (user, Body) {
    try {
        const { error, value } = authValidation.updatevendorValidation(Body);

        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        if (user.role !== "vendor") {
            throw new AppError("You are not authorized to update profile", 403);
        }

        if (!user.isActive) {
            throw new AppError("Your account has been blocked", 403);
        }

        const updateFields = {};

        if (value.vendor_mobile) updateFields.phone_no = value.vendor_mobile;
        if (value.vendor_address) updateFields.address = value.vendor_address;
        if (value.vendor_city) updateFields.city = value.vendor_city;
        if (value.vendor_state) updateFields.state = value.vendor_state;
        if (value.vendor_pincode) updateFields.pincode = value.vendor_pincode;
        if (value.vendor_country) updateFields.country = value.vendor_country;
        if (value.is_Active !== undefined) updateFields.isActive = value.is_Active;

        Object.assign(user, updateFields);
        const updatedUser = await user.save();

        return updatedUser;

    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};
exports.changePasswordCore = async function (user, Body) {
    try {
        const { old_password, new_password } = Body;

        const { error } = authValidation.changePasswordValidation(Body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        if (old_password === new_password) {
            throw new AppError("New password cannot be the same as old password", 400);
        }
        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            throw new AppError("Invalid old password", 400);
        }

        const hashedPassword = await bcrypt.hash(new_password, 12);
        user.password = hashedPassword;
        await user.save();

        return { message: "Password changed successfully" };

    } catch (error) {
        if (error.statusCode) {
            throw error;
        }
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};

exports.deleteMyAccountCore = async function (user) {
    try {

        if (user.role === "vendor") {
            if (user.vendor_role !== "owner") {
                throw new AppError("Only the store owner can delete this vendor account", 403);
            }
        }

        if (user.isActive === false) {
            throw new AppError("Account is already deactivated", 400);
        }

        user.isActive = false;
        user.updatedAt = new Date();

        await user.save();

        await UserModel.findByIdAndUpdate(user._id, { isActive: false }, { new: true });


        return { message: "Your account has been successfully deleted" };

    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};

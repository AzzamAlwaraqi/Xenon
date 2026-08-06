const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const AppError = require("../../../utils/AppError");
const VendorModel = require("../../../Models/VendorModel");
const UserModel = require("../../../Models/UserModel");
const OTPModel = require("../../../Models/OTPModel");
const vendorCore = require("./vendorAccountCore");
const authValidation = require("../../../validations/authValidation");
exports.getVendorCore = async function (vendorId) {
    try {
        let vendor = await VendorModel.findById(vendorId).select("vendor_name vendor_email vendor_mobile vendor_address vendor_city vendor_state vendor_pincode vendor_country vendor_status vendor_type");
        
        if (!vendor) {
            vendor = await VendorModel.findOne({
                $or: [
                    { vendor_owner_id: vendorId },
                    { vendor_user_id: vendorId }
                ]
            }).select("vendor_name vendor_email vendor_mobile vendor_address vendor_city vendor_state vendor_pincode vendor_country vendor_status vendor_type");
        }

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

    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();
    try {
        user.password = password;
        await user.save({ session: dbSession });

        vendor.vendor_password = password;
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
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

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

        const vendor = await VendorModel.findOne({
            $or: [
                { vendor_owner_id: user._id },
                { vendor_user_id: user._id }
            ]
        }).session(dbSession);

        if (!vendor) {
            throw new AppError("Vendor profile not found", 404);
        }

        // 1. Update User fields
        if (value.name) user.name = value.name;
        
        const mobileNum = value.phone_no || value.mobile;
        if (mobileNum) user.mobileNumber = mobileNum;

        await user.save({ session: dbSession });

        // 2. Update Vendor fields
        if (value.company_name) {
            vendor.vendor_name = value.company_name;
        } else if (value.name && !vendor.vendor_name) {
            vendor.vendor_name = value.name;
        }

        if (mobileNum) vendor.vendor_mobile = mobileNum;
        if (value.address) vendor.vendor_address = value.address;
        if (value.city) vendor.vendor_city = value.city;
        if (value.state) vendor.vendor_state = value.state;
        if (value.pincode) vendor.vendor_pincode = value.pincode;
        if (value.country) vendor.vendor_country = value.country;
        if (value.vendor_type) vendor.vendor_type = value.vendor_type;

        await vendor.save({ session: dbSession });

        await dbSession.commitTransaction();
        dbSession.endSession();

        return vendor;

    } catch (error) {
        await dbSession.abortTransaction();
        dbSession.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};
exports.changePasswordCore = async function (user, Body) {
    try {
        const { error, value } = authValidation.changePasswordValidation(Body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const { old_password, new_password } = value;

        if (old_password === new_password) {
            throw new AppError("New password cannot be the same as old password", 400);
        }
        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            throw new AppError("Invalid old password", 400);
        }

        user.password = new_password;
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
            const vendor = await VendorModel.findOne({ vendor_owner_id: user._id });
            if (!vendor) {
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

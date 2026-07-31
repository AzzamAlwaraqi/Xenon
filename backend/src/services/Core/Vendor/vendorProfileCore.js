const AppError = require("../../../utils/AppError");
const VendorModel = require("../../../Models/VendorModel");
const bcrypt = require("bcrypt");
exports.getProfileCore = async function (vendor) {
    try {
        const data = await VendorModel.find({
            email: vendor.email
        })
        if (data.length === 0) {
            throw new AppError("Vendor not found", 404);
        }
        
        if(data[0].deletionRequestedAt){
            const timeSinceRequest = Date.now() - new Date(data[0].deletionRequestedAt).getTime();
            const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000;

            if (timeSinceRequest > thirtyDaysInMillis) {
                throw new AppError("Account is permanently deleted", 403);
            } else {
                throw new AppError("Account is pending deletion. Please restore your account to continue.", 403);
            }
        }

        if (!data[0].is_Active) {
            throw new AppError("Your account has been blocked or deactivated", 403);
        }
        return data;
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.updateProfileCore = async function (Body, id) {
    try {
        const { name, email,file } = Body;
        const existingVendor = await VendorModel.findById(id);
        if (!existingVendor) {
            throw new AppError("Vendor not found", 404);
        }
        if (existingVendor.email !== email) {
            const existingVendor = await VendorModel.findOne({ email });
            if (existingVendor) {
                throw new AppError("Vendor already exists", 400);
            }
        }
        const updatedVendor = await VendorModel.findByIdAndUpdate(id, Body, { new: true });
        return updatedVendor;
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}

exports.updatePasswordCore = async function (Body, id) {
    try {
        const { oldPassword, newPassword } = Body;
        const existingVendor = await VendorModel.findById(id).select("+vendor_password");
        if (!existingVendor) {
            throw new AppError("Vendor not found", 404);
        }
        const isPasswordValid = await bcrypt.compare(oldPassword, existingVendor.vendor_password);
        if (!isPasswordValid) {
            throw new AppError("Invalid password", 401);
        }
        if(oldPassword === newPassword){
            throw new AppError("New password is same as old password", 400);
        }
        const hashPassword = await bcrypt.hash(newPassword, 12);
        const updatedVendor = await VendorModel.findByIdAndUpdate(id, { vendor_password: hashPassword, vendor_old_password: existingVendor.vendor_password }, { new: true });
        return updatedVendor;
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.deleteVendorProfileCore = async function (vendor) {
    try {
        const { id } = vendor;

        if (!id) {
            throw new AppError("Vendor ID is required", 400);
        }

        const existingVendor = await VendorModel.findById(id);
        if (!existingVendor) {
            throw new AppError("Vendor not found", 404);
        }

        if (existingVendor.is_Active === false || existingVendor.deletionRequestedAt) {
            throw new AppError("Account is already inactive or pending deletion", 400);
        }
        const updatedVendor = await VendorModel.findByIdAndUpdate(
            id, 
            { 
                is_Active: false, 
                deletionRequestedAt: Date.now() 
            }, 
            { new: true }
        );

        updatedVendor.vendor_password = undefined;
        updatedVendor.vendor_old_password = undefined;

        return updatedVendor;

    } catch (error) {
        if (error.statusCode) {
            throw error;
        }
        throw new AppError(error.message || "Internal Server Error", 500);
    }
}
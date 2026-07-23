const AppError = require("../../utils/AppError");
const VendorModel = require("../../../Models/VendorModel");
const UserModel = require("../../../Models/UserModel");
const vendorCore = require("./vendorAccountCore");
exports.getVendor = async function (Body) {
    try {
        const { name, email, password, role, file } = Body;

        const [existVendor, existOwner] = await Promise.all([
            VendorModel.findOne({ vendor_email: email }),
            UserModel.findOne({ email })
        ]);

        if (existVendor || existOwner) {
            throw new AppError("Vendor or User already exists", 409);
        }

        const vendor = await vendorCore.createVendorCore(name, email, password, role, file);
        return vendor;
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};

exports.resetPasswordVendor = async (req, res,next) =>{
    try {
        if(user.role !== "vendor"){
            throw new AppError("You are not authorized to reset password", 403);
        }
        if(user.isActive === false){
            throw new AppError("Your account has been blocked", 403);
        }
        const isPasswordValid = await user.comparePassword(oldPassword);
        if(!isPasswordValid){
            throw new AppError("Invalid password", 401);
        }
        const updatedUser = user.findByIdAndUpdate(user._id, { password:newPassword }, { new: true });
        return updatedUser;
    }
    catch(error){
        next(new AppError(error.message, 400));
    }
}
exports.updateProfileVendor =async (req,res,next)=>{
    try {
        return "updateProfileVendor not yet implemented";
    }
    catch(error){
        next(new AppError(error.message, 400));
    }
}
exports.changePasswordVendor = (req,res,next)=>{
    try {
        return "changePasswordVendor not yet implemented";
    }
    catch(error){
        next(new AppError(error.message, 400));
    }
}
exports.deleteProfileVendor = async (req,res,next)=>{
    try {
        if(user.role !== "vendor"){
            throw new AppError("You are not authorized to delete profile", 403);
        }
        if(user.isActive === false){
            throw new AppError("Your account has been blocked", 403);
        }
        const updatedUser = await user.findByIdAndUpdate(user._id, { active: false }, { new: true });
        return updatedUser;
    }
    catch(error){
        throw new AppError(error.message, 400);
    }
}
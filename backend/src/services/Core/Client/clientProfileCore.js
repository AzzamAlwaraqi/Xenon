const AppError = require("../../utils/AppError");

exports.getprofileCore = async function(user) {
    try {
        return user;
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
};

exports.updateprofileCore = async function (user,reqBody) {
    try {
        const updatedUser = await User.findByIdAndUpdate(user._id, reqBody, { new: true });
        return updatedUser;
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
};

exports.changePasswordCore = async function (user,newPassword,oldPassword) {
    try {
        const isPasswordValid = await user.comparePassword(oldPassword);
        if(!isPasswordValid){
            return AppError("Invalid old password", 401);
        }
        const updatedUser = await User.findByIdAndUpdate(user._id, { password:newPassword }, { new: true });
        return updatedUser;
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
};

exports.deleteprofileCore = async function (user) {
    try {
        const updatedUser = await User.findByIdAndUpdate(user._id, { active: false }, { new: true });
        return updatedUser;
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
};

exports.getMyReviewsCore = async function (user) {
    try {
        return "getMyReviews not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
};
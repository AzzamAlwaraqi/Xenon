const User = require("../../../Models/UserModel");
const AppError = require("../../../utils/AppError");
exports.createClientCore = async function (name, email, password, gender, mobileNumber, DateOfBirth) {
    try {
        if(role !== "user"){
            return AppError("Invalid role", 400);
        }
        const newUser = await User.create({ name, email, password, gender, mobileNumber, DateOfBirth });
        return newUser;
    } catch (err) {
       throw AppError(err.message, 400);
    }
};
exports.loginClientCore = async function (email,password) {
    try{
        const user = await User.findOne({ email });
        if(!user){
            return next(new AppError("User not found", 404));
        }
        const isPasswordValid = await user.comparePassword(password);
        if(!isPasswordValid){
            return next(new AppError("Invalid password", 401));
        }
        const token = user.getJwtToken();
        return token;
    }
    catch(error){
        throw AppError(error.message, 400);
    }
}
exports.logoutClientCore = function() {
    try{
        return "Logout successful";
    }
    catch(error){
        throw AppError(error.message, 400);
    }
}
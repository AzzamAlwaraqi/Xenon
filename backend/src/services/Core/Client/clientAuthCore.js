const User = require("../../../Models/UserModel");
const AppError = require("../../../utils/AppError");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const SessionModel = require("../../../Models/SessionModel");

exports.createClientCore = async function (name, email, password, gender, mobileNumber, DateOfBirth ) {
    try {
        const user = await User.findOne({ email });
        if(user){
            throw new AppError("User already exists", 400);
        }
        if(user.mobileNumber === mobileNumber){
            throw new AppError("User already exists", 400);
        }
        const newUser = await User.create({ name, email, password, gender, mobileNumber, DateOfBirth, role: "user"  });
        return newUser;
    } catch (err) {
       throw new AppError(err.message, 400);
    }
};
exports.loginClientCore = async function (email, password) {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            throw new AppError("Invalid email or password", 401);
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError("Invalid email or password", 401);
        }
        
        // Return user to let controller generate tokens
        return user;
    }
    catch (error) {
        throw new AppError(error.message, 400);
    }
}
exports.logoutClientCore = async function (user, token) {
    try {
        if (user.role !== "user") {
            throw new AppError("Invalid role", 400);
        }
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const session = await SessionModel.findOneAndUpdate({ user_id: user._id, token_id: hashedToken }, { is_active: false });

        if (!session) {
            throw new AppError("Active session not found or already logged out", 404);
        }
        return "Logout successful";
    }
    catch (error) {
        throw new AppError(error.message, 400);
    }
}
exports.updateClientCore = async function (user, updates) {
    try {
       const {mobileNumber,email} = user;
       if(mobileNumber){
        const user = await User.findOne({ mobileNumber });
        if(user){
            throw new AppError("User already exists", 400);
        }
       }
       if(email){
        const user = await User.findOne({ email });
        if(user){
            throw new AppError("User already exists", 400);
        }
        const update = {};

       }
    }
    catch (error) {
        throw new AppError(error.message, 400);
    }
}
exports.updatepasswordCore = async function (user, updates) {
    try {
        
    } catch (error) {
        throw new AppError(error.message, 400);
    }
}
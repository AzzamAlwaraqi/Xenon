const User = require("../../Models/UserModel");
const AppError = require("../../utils/AppError");
exports.createClient = async (req, res, next) => {
    try {
        const { name, email, password, gender, mobileNumber, DateOfBirth, role } = req.body;
        if(role !== "user"){
            return next(new AppError("Invalid role", 400));
        }
        const newUser = await User.create({ name, email, password, gender, mobileNumber, DateOfBirth, role });
        res.status(201).json({
            status: "success",
            data: {
                user: newUser
            }
        });
    } catch (err) {
       next(new AppError(err.message, 400));
    }
};
exports.loginClient = async (req, res, next) => {
    try{
        
    }
    catch(error){
        next(new AppError(error.message, 400));
    }
}
exports.logoutClient = async (req, res, next) => {
    try{

    }
    catch(error){
        next(new AppError(error.message, 400));
    }
}
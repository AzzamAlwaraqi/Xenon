const User = require("./Models/UserModel");
const AppError = require("./utils/AppError");
const { STAFF_POSITIONS } = require("./utils/checkvalidete"); 
const bcrypt = require("bcrypt");

exports.registerAdmin = async (req, res, next) => {
    try {
        const { 
            name, 
            email, 
            password, 
            passwordConfirm, 
            mobileNumber, 
            position, 
            adminSecretKey 
        } = req.body;

        const creatorUser = req.user || null;
        
        const isValidSecret = adminSecretKey && adminSecretKey === process.env.ADMIN_CREATION_SECRET;
        const isCreatedByAdmin = creatorUser && creatorUser.role === 'admin';

        if (!isValidSecret && !isCreatedByAdmin) {
            return next(new AppError("Access Denied: You do not have permission to create an admin account.", 403));
        }
        if(!name || !email || !password || !passwordConfirm || !mobileNumber || !adminSecretKey){
            return next(new AppError("Missing required fields", 400));
        }

        if(password !== passwordConfirm){
            return next(new AppError("Passwords do not match", 400));
        }
        if(mobileNumber.length !== 10){
            return next(new AppError("Mobile number must be 10 digits", 400));
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        if(position && !STAFF_POSITIONS.admin.includes(position)) {
            return next(new AppError(`Invalid position. Allowed positions: ${STAFF_POSITIONS.admin.join(', ')}`, 400));
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError("Email is already in use.", 409));
        }

        const newAdmin = await User.create({
            name,
            email,
            password: hashedPassword,
            mobileNumber,
            role: 'admin',
            position: position || 'supervisor', 
            isActive: true,
            isEmailVerified: true 
        });

        newAdmin.password = undefined;

        res.status(201).json({
            status: "success",
            message: "Admin account created successfully.",
            data: {
                admin: newAdmin
            }
        });

    } catch (error) {
        next(error);
    }
};
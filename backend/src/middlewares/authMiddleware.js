const jwt = require("jsonwebtoken");
const User = require("../Models/UserModel");
const AppError = require("../utils/AppError");

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.AppError("You are not logged in! Please log in to get access.", 401);
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.AppError("Invalid token. Please log in again!", 401);
        }

        // Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.AppError("The user belonging to this token no longer exists.", 401);
        }

        // Attach user to request
        req.user = currentUser;
        next();
    } catch (error) {
        next(error);
    }
};
const jwt = require("jsonwebtoken");
const User = require("../Models/UserModel");
const AppError = require("../utils/AppError");
const { checkRole } = require("../utils/checkvalidete");
const Vendor = require("../Models/VendorModel");


exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return next(new AppError("You are not logged in! Please log in to get access.", 401));
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return next(new AppError("Invalid token. Please log in again!", 401));
        }

        let currentUser;

        if (checkRole(decoded.role, ["vendor"])) {
            currentUser = await Vendor.findById(decoded.id);
        } else {
            currentUser = await User.findById(decoded.id);
        }

        if (!currentUser) {
            return next(new AppError("The user belonging to this token no longer exists.", 401));
        }

        // Attach user to request
        req.user = currentUser;
        next();
    } catch (error) {
        next(error);
    }
};
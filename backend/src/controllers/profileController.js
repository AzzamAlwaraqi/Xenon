const profileCore = require("../services/Core/profileCore");


exports.getProfile = async (req, res, next) => {
    try {
        const profile = await profileCore.getProfileCore(req.user);
        
        res.status(200).json({
            status: "success",
            message: "Profile fetched successfully",
            data: { profile }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const updatedProfile = await profileCore.updateProfileCore(req.user, req.body);
        
        res.status(200).json({  
            status: "success",
            message: "Profile updated successfully",
            data: { profile: updatedProfile }
        });
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        // Variables are standardized by Joi Middleware before reaching here
        const { old_password, new_password } = req.body;
        
        const result = await profileCore.updatePasswordCore(req.user, old_password, new_password);
        
        res.status(200).json({
            status: "success",
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteProfile = async (req, res, next) => {
    try {
        const result = await profileCore.deleteAccountCore(req.user);
        
        res.status(200).json({
            status: "success",
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};


exports.getMyReviews = async (req, res, next) => {
    try {
        const reviews = await profileCore.getAllReviewsCore(req.user);
        
        res.status(200).json({
            status: "success",
            message: "Reviews fetched successfully",
            data: {
                count: reviews.length, 
                reviews
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateFCMToken = async (req, res, next) => {
    try {
        const { fcm_token } = req.body;
        await profileCore.updateFCMTokenCore(req.user, fcm_token);
        res.status(200).json({
            status: "success",
            message: "FCM token updated successfully"
        });
    } catch (error) {
        next(error);
    }
};

exports.requestVendorOnboarding = async (req, res, next) => {
    try {
        const result = await profileCore.requestVendorOnboardingCore(req.user, req.body, req.files);
        
        res.status(201).json({
            status: "success",
            message: "Vendor application submitted successfully",
            data: result.data
        });
    } catch (error) {
        next(error);
    }
};
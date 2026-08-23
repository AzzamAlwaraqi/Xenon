const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const validation = require("../validations/authValidation");
const router = express.Router();

// Note: Public
router.post("/register",validation.createAccountValidation, authController.register);
// Note: Public
router.post("/login",validation.loginValidation, authController.login);

// Note: Accessible by user, vendor, admin
router.post("/logout", protect,validation.logoutValidation, authController.logout);
// Note: Public
router.post("/forgot-password",validation.forgotPasswordValidation, authController.forgotPassword);
// Note: Public
router.post("/reset-password",validation.resetPasswordValidation, authController.resetPassword);
// Note: Public
router.post("/verify-otp",validation.verifyOtpValidation, authController.verifyOtp);
// Note: Public
router.post("/send-otp",validation.sendOtpValidation, authController.sendOtp);
// Note: Public
router.post("/refresh-token", validation.refreshTokenValidation, authController.refreshToken);

module.exports = router;

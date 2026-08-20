const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const validation = require("../validations/authValidation");
const router = express.Router();

router.post("/register",validation.createAccountValidation, authController.register);
router.post("/login",validation.loginValidation, authController.login);

router.post("/logout", protect,validation.logoutValidation, authController.logout);
router.post("/forgot-password",validation.forgotPasswordValidation, authController.forgotPassword);
router.post("/reset-password",validation.resetPasswordValidation, authController.resetPassword);
router.post("/verify-otp",validation.verifyOtpValidation, authController.verifyOtp);
router.post("/send-otp",validation.sendOtpValidation, authController.sendOtp);
router.post("/refresh-token", validation.refreshTokenValidation, authController.refreshToken);

module.exports = router;

const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const { validate, validateRoleBased } = require("../middlewares/validate");
const authValidation = require("../validations/authValidation");
const router = express.Router();

// Role-based validation (user vs vendor)
router.post("/register", validateRoleBased(authValidation.createClientValidation, authValidation.createAccountValidation), authController.register);
router.post("/login", validate(authValidation.loginAccountValidation), authController.login);

router.post("/logout", protect, authController.logout); // Logout validation is simple
router.post("/reset-password", validate(authValidation.resetPasswordValidation), authController.resetPassword);

module.exports = router;

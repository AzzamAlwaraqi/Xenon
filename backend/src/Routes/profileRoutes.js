const express = require("express");
const profileController = require("../controllers/profileController");
const { protect } = require("../middlewares/authMiddleware");
const { validate, validateProfileUpdate } = require("../middlewares/validate");
const authValidation = require("../validations/authValidation");
const router = express.Router();

router.get("/me", protect, profileController.getProfile);
router.put("/update", protect, validateProfileUpdate(authValidation.updateProfileValidation, authValidation.updatevendorValidation), profileController.updateProfile);
router.put("/change-password", protect, validate(authValidation.changePasswordValidation), profileController.changePassword);
router.put("/delete", protect, validate(authValidation.deleteAccountValidation), profileController.deleteProfile);
router.get("/my-reviews", protect, profileController.getMyReviews);

module.exports = router;


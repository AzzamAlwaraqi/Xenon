const express = require("express");
const profileController = require("../controllers/profileController");
const { protect } = require("../middlewares/authMiddleware");
const validation = require("../validations/authValidation");
const router = express.Router();

// Note: Accessible by user, vendor, admin
router.get("/me", protect, profileController.getProfile);
// Note: Accessible by user, vendor, admin
router.put("/update", protect,validation.updateProfileValidation, profileController.updateProfile);
// Note: Accessible by user, vendor, admin
router.put("/change-password", protect, validation.changePasswordValidation, profileController.changePassword);
// Note: Accessible by user, vendor, admin
router.put("/delete", protect, validation.deleteAccountValidation, profileController.deleteProfile);
//router.get("/my-reviews", protect, profileController.getMyReviews);
// Note: Accessible by user, vendor, admin
router.put("/fcm-token", protect, profileController.updateFCMToken);

module.exports = router;

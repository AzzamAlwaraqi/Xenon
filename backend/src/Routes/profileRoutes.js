const express = require("express");
const profileController = require("../controllers/profileController");
const { protect } = require("../middlewares/authMiddleware");
const validation = require("../validations/authValidation");
const router = express.Router();

router.get("/me", protect, profileController.getProfile);
router.put("/update", protect,validation.updateProfileValidation, profileController.updateProfile);
router.put("/change-password", protect, validation.changePasswordValidation, profileController.changePassword);
router.put("/delete", protect, validation.deleteAccountValidation, profileController.deleteProfile);
//router.get("/my-reviews", protect, profileController.getMyReviews);

module.exports = router;

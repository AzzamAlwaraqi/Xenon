const express = require("express");
const profileController = require("../controllers/profileController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/me", protect, profileController.getProfile);
router.put("/update", protect, profileController.updateProfile);
router.put("/change-password", protect, profileController.changePassword);
router.put("/delete", protect, profileController.deleteProfile);
router.get("/my-reviews", protect, profileController.getMyReviews);

module.exports = router;

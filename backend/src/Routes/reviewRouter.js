const express = require("express");
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const { createReviewValidation, getReviewsQueryValidation, paramIdValidation, updateReviewValidation,updateReviewStatusValidation} = require("../validations/reviewValidation");
const reviewController = require("../controllers/Client/reviewController");
const { cacheMiddleware } = require("../middlewares/cacheMiddleware");

const router = express.Router();

// User routes
// Note: Accessible by user

router.post("/createReview", protect, restrictTo("user"), createReviewValidation, reviewController.createReview);

// Note: Accessible by user
// Query Parameters (optional):
// ?page=1&limit=10&rating=5&status=accepted
router.get("/getMyReviews", protect, restrictTo("user"), getReviewsQueryValidation, reviewController.getMyReviews);

// Note: Accessible by user, vendor, admin
// Route Parameters: id (UUID)
router.get("/getReviewById/:id", protect, restrictTo("user", "vendor", "admin"), paramIdValidation, reviewController.getReviewById);

// Note: Accessible by user
// Route Parameters: id (UUID)

router.put("/updateReview/:id", protect, restrictTo("user"), paramIdValidation, updateReviewValidation, reviewController.updateReview);

// Note: Accessible by user, admin
// Route Parameters: id (UUID)
router.patch("/deleteReview/:id", protect, restrictTo("user", "admin"), paramIdValidation, reviewController.deleteReview);

// Public routes
// Note: Public
// Route Parameters: packageId (UUID)

router.get("/package/:packageId", cacheMiddleware(300), getReviewsQueryValidation, reviewController.getPackageReviews);

// Admin routes
// Note: Accessible by admin

router.get("/getAllReviews", protect, restrictTo("admin"), getReviewsQueryValidation, reviewController.getAllReviews);

// Note: Accessible by admin
// Route Parameters: id (UUID)

router.patch("/updateReviewStatus/:id", protect, restrictTo("admin"), paramIdValidation, updateReviewStatusValidation, reviewController.updateReviewStatus);

module.exports = router;
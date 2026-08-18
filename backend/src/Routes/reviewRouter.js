const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { 
    createReviewValidation, 
    getReviewsQueryValidation, 
    paramIdValidation, 
    updateReviewValidation,
    updateReviewStatusValidation
} = require("../validations/reviewValidation");
const reviewController = require("../controllers/Client/reviewController");

const router = express.Router();

// User routes
router.post("/createReview", protect, createReviewValidation, reviewController.createReview);
router.get("/getMyReviews", protect, getReviewsQueryValidation, reviewController.getMyReviews);
router.get("/getReviewById/:id", protect, paramIdValidation, reviewController.getReviewById);
router.put("/updateReview/:id", protect, paramIdValidation, updateReviewValidation, reviewController.updateReview);
router.delete("/deleteReview/:id", protect, paramIdValidation, reviewController.deleteReview);

// Public routes
router.get("/package/:packageId", getReviewsQueryValidation, reviewController.getPackageReviews);

// Admin routes
router.get("/getAllReviews", protect, getReviewsQueryValidation, reviewController.getAllReviews);
router.patch("/updateReviewStatus/:id", protect, paramIdValidation, updateReviewStatusValidation, reviewController.updateReviewStatus);

module.exports = router;
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { protect } = require("../middlewares/authMiddleware");


// Vendor routes
router.get("/vendor/dashboard", protect, analyticsController.getVendorAnalytics);
// Admin routes
router.get("/admin/dashboard", protect, analyticsController.getAdminAnalytics);
module.exports = router;
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { protect } = require("../middlewares/authMiddleware");


// Vendor routes
// Note: Accessible by vendor
router.get("/vendor/dashboard", protect, analyticsController.getVendorAnalytics);
// Admin routes
// Note: Accessible by admin
router.get("/admin/dashboard", protect, analyticsController.getAdminAnalytics);
module.exports = router;
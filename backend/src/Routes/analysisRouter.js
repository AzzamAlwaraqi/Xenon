const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

const { protect } = require("../middlewares/authMiddleware"); 
const { restrictTo } = require("../middlewares/authMiddleware"); 

router.get("/vendor/dashboard", protect, restrictTo('vendor'), analyticsController.getVendorAnalytics);

router.get("/packages/:packageId", protect, restrictTo('vendor', 'admin'),analyticsController.getPackageAnalytics);

router.get("/admin/dashboard", protect, restrictTo('admin'), analyticsController.getAdminAnalytics);

module.exports = router;
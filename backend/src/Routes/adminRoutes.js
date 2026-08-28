const express = require("express");
const moderationController = require("../controllers/Admin/moderationController");
const vendorApprovalController = require("../controllers/Admin/vendorApprovalController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminValidation = require("../validations/adminOperationsValidator");
const router = express.Router();

// Apply auth protection and admin check for all admin routes
router.use(authMiddleware.protect, authMiddleware.restrictTo("admin"));



// ==========================================
// 2. Moderation / Report Routes
// ==========================================
// Note: Accessible by admin
router.get("/reports", moderationController.getAllReports);
// Note: Accessible by admin
router.post("/reports/:reportId/resolve", adminValidation.resolveReportValidator, moderationController.resolveReport);
// Note: Accessible by admin
router.post("/reports/:reportId/escalate", adminValidation.escalateReportValidator, moderationController.escalateReport);
// Note: Accessible by admin
router.get("/users/:userId/moderation-history", adminValidation.getUserHistoryValidator, moderationController.getUserModerationHistory);

// ==========================================
// 3. Vendor Approval Routes
// ==========================================
// Note: Accessible by admin
router.get("/vendor-approvals", vendorApprovalController.getAllVendors);
// Note: Accessible by admin
router.get("/vendor-approvals/:vendorId", adminValidation.getVendorDetailsValidator, vendorApprovalController.getVendorDetails);
// Note: Accessible by admin
router.patch("/vendor-approvals/:vendorId/status", adminValidation.updateVendorStatusValidator, vendorApprovalController.updateApprovalStatus);

module.exports = router;
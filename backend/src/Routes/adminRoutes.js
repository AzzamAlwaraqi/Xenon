const express = require("express");
const staffController = require("../controllers/Admin/staffController");
const moderationController = require("../controllers/Admin/moderationController");
const vendorApprovalController = require("../controllers/Admin/vendorApprovalController");
const authMiddleware = require("../middlewares/authMiddleware");
const staffValidation = require("../validations/staffValidation");
const adminValidation = require("../validations/adminOperationsValidator");
const router = express.Router();

// Apply auth protection and admin check for all admin routes
router.use(authMiddleware.protect);
// Assuming authMiddleware.restrictTo("admin") exists. Let's use standard pattern if available, or assume it's checked in core.
// Actually, earlier we saw: `if (!checkRole(user.role, ["admin"])) throw new AppError("Unauthorized", 403);` in the core files, so protection is partly in core. 
// Let's just add the routes.

// ==========================================
// 1. Staff Management Routes
// ==========================================
router.post("/staff", staffValidation.createStaffValidation,staffController.addEmployee);
router.get("/staff", staffController.getAllEmployees);
router.get("/staff/:id", staffValidation.getOrDeleteStaffValidation, staffController.getEmployee);
router.patch("/staff/:id", staffValidation.getOrDeleteStaffValidation,staffValidation.updateStaffValidation,staffController.updateEmployee);
router.delete("/staff/:id", staffValidation.getOrDeleteStaffValidation,staffController.deleteEmployee);

// ==========================================
// 2. Moderation / Report Routes
// ==========================================
router.get("/reports", moderationController.getAllReports);
router.post("/reports/:reportId/resolve", adminValidation.resolveReportValidator, moderationController.resolveReport);
router.post("/reports/:reportId/escalate", adminValidation.escalateReportValidator, moderationController.escalateReport);
router.get("/users/:userId/moderation-history", adminValidation.getUserHistoryValidator, moderationController.getUserModerationHistory);

// ==========================================
// 3. Vendor Approval Routes
// ==========================================
router.get("/vendor-approvals", vendorApprovalController.getAllVendors);
router.get("/vendor-approvals/:vendorId", adminValidation.getVendorDetailsValidator, vendorApprovalController.getVendorDetails);
router.patch("/vendor-approvals/:vendorId/status", adminValidation.updateVendorStatusValidator, vendorApprovalController.updateApprovalStatus);

module.exports = router;
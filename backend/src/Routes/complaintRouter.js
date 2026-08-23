const express = require("express");
const multer = require("multer");
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const { createComplaintValidation,getComplaintsQueryValidation,complaintIdParamValidation,respondOnComplaintValidation } = require("../validations/ComplaintValidation");
const complaintController = require("../controllers/complaintController");

const router = express.Router();

// Multer memory storage for handling attachment buffers (up to 3 files, 5MB limit each)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// User routes
// Note: Accessible by user
// Request Body (Multipart Form-Data or JSON):
// {
//     "complaint_type": "Service" | "Billing" | "Other" (required),
//     "complaint_title": "Title (5-100 characters, required)",
//     "complaint_message": "Description of the complaint (10-1000 characters, required)",
//     "complaint_priority": "low" | "medium" | "high" | "critical" (required),
//     "vendor_id": "UUID (optional)",
//     "booking_id": "UUID (optional)"
// }
// Files: attachments (Array of files, up to 3 files, 5MB limit each, optional)
router.post("/createComplaint",protect,restrictTo("user"),upload.array("attachments", 3),createComplaintValidation, complaintController.createComplaintController);

// Note: Accessible by user
// Query Parameters (optional):
// ?page=1&limit=10&status=pending&priority=high&type=Service
router.get("/getMyComplaints",protect,restrictTo("user"),getComplaintsQueryValidation, complaintController.getMyComplaintsController);

// Note: Accessible by user, vendor, admin
// Route Parameters: complaintId (UUID)
router.get("/getComplaintById/:complaintId",protect,restrictTo("user", "vendor", "admin"),complaintIdParamValidation,complaintController.getComplaintByIdController);

// Note: Accessible by user
// Route Parameters: complaintId (UUID)
router.put("/cancelComplaint/:complaintId",protect,restrictTo("user"),complaintIdParamValidation, complaintController.cancelComplaintController);

// Vendor routes
// Note: Accessible by vendor
// Query Parameters (optional):
// ?page=1&limit=10&status=pending&priority=high
router.get("/getComplaintsAgainstMe",protect,restrictTo("vendor"),getComplaintsQueryValidation,complaintController.getComplaintsAgainstMeController);

// Admin routes
// Note: Accessible by admin
// Query Parameters (optional):
// ?page=1&limit=20&status=pending&priority=high&vendor_id=UUID&search=text
router.get("/getAllComplaints",protect,restrictTo("admin"),getComplaintsQueryValidation,complaintController.getAllComplaintsController);

// Note: Accessible by admin, vendor
// Route Parameters: complaintId (UUID)
// Request Body:
// {
//     "status": "pending" | "accepted" | "rejected" | "completed" | "cancelled" (optional),
//     "admin_response": "Admin response text (max 1000 characters, optional)",
//     "reply": "Reply text (max 1000 characters, optional)"
// }
router.post("/respondToComplaint/:complaintId",protect,restrictTo("admin", "vendor"),complaintIdParamValidation,respondOnComplaintValidation,complaintController.respondToComplaintController);

module.exports = router;
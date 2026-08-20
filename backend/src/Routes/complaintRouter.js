const express = require("express");
const multer = require("multer");
const { protect } = require("../middlewares/authMiddleware");
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
router.post("/createComplaint",protect,upload.array("attachments", 3),createComplaintValidation, complaintController.createComplaintController);

router.get("/getMyComplaints",protect,getComplaintsQueryValidation, complaintController.getMyComplaintsController);

router.get("/getComplaintById/:complaintId",protect,complaintIdParamValidation,complaintController.getComplaintByIdController);

router.put("/cancelComplaint/:complaintId",protect,complaintIdParamValidation, complaintController.cancelComplaintController);

// Vendor routes
router.get("/getComplaintsAgainstMe",protect,getComplaintsQueryValidation,complaintController.getComplaintsAgainstMeController);

// Admin routes
router.get("/getAllComplaints",protect,getComplaintsQueryValidation,complaintController.getAllComplaintsController);

router.post("/respondToComplaint/:complaintId",protect,complaintIdParamValidation,respondOnComplaintValidation,complaintController.respondToComplaintController);

module.exports = router;
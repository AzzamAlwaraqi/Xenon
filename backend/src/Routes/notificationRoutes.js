const express = require("express");
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

// Only Vendors
// Note: Accessible by vendor
router.post("/send-update", notificationController.sendUpdateToClient);

// Admins / System
// Note: Accessible by admin or vendor but for all users booking it this company 
router.post("/broadcast", notificationController.sendBroadcastNotification);

// All Authenticated Users (Admin, User, Vendor)
// Note: Accessible by user, vendor, admin
router.get("/", notificationController.getMyNotifications);
// Note: Accessible by admin or vendor to see notifications they sent
router.get("/sent", authMiddleware.restrictTo("admin", "vendor"), notificationController.getSentNotifications);
// Specific named routes MUST come before the /:id wildcard
// Note: Accessible by user, vendor, admin
router.patch("/read-all", notificationController.markAllAsRead);
// Note: Accessible by user, vendor, admin
router.patch("/delete-all", notificationController.deleteAllNotifications);
// Note: Accessible by user, vendor, admin
router.patch("/:id/read", notificationController.markAsRead);
// Note: Accessible by user, vendor, admin
router.patch("/:id", notificationController.deleteNotification);

module.exports = router;

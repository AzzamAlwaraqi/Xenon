const express = require("express");
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

// Only Vendors
router.post("/send-update", notificationController.sendUpdateToClient);

// Admins / System
router.post("/send", notificationController.sendNotification);
router.post("/broadcast", notificationController.sendBroadcastNotification);

// All Authenticated Users (Admin, User, Vendor)
router.get("/", notificationController.getMyNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id", notificationController.deleteNotification);
router.patch("/delete-all", notificationController.deleteAllNotifications);

module.exports = router;

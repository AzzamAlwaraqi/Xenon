const express = require("express");
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.post("/send-update", notificationController.sendUpdateToClient);
router.post("/send", notificationController.sendNotification);
router.post("/broadcast", notificationController.sendBroadcastNotification);
router.get("/", notificationController.getMyNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id", notificationController.deleteNotification);
router.patch("/delete-all", notificationController.deleteAllNotifications);

module.exports = router;

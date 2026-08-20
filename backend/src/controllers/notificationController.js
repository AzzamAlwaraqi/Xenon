const notificationCore = require("../services/Core/notificationCore");
const AppError = require("../utils/AppError");

exports.sendUpdateToClient = async (req, res, next) => {
    try {
        const { userId, type, message } = req.body;
        const vendorId = req.user._id;

        if (req.user.role !== "vendor") {
            return next(new AppError("Only vendors can send updates to clients.", 403));
        }

        const result = await notificationCore.vendorSendUpdateCore(vendorId, userId, type, message);
        return res.status(201).json({ status: "success", data: result });
    } catch (error) {
        next(error);
    }
};

exports.sendNotification = async (req, res, next) => {
    try {
        const { userId, vendorId, adminId, type, message } = req.body;
        const result = await notificationCore.sendNotificationCore(userId, vendorId, adminId, type, message);
        return res.status(201).json({ status: "success", data: result });
    } catch (error) {
        next(error);
    }
};

exports.sendBroadcastNotification = async (req, res, next) => {
    try {
        const { userIds, vendorId, type, message } = req.body;
        const result = await notificationCore.sendBroadcastNotificationCore(userIds, vendorId, type, message);
        return res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getMyNotifications = async (req, res, next) => {
    try {
        const result = await notificationCore.getMyNotificationsCore(req.user);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const result = await notificationCore.markAsReadCore(req.user, req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.markAllAsRead = async (req, res, next) => {
    try {
        const result = await notificationCore.markAllAsReadCore(req.user);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.deleteNotification = async (req, res, next) => {
    try {
        const result = await notificationCore.deleteNotificationCore(req.user, req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.deleteAllNotifications = async (req, res, next) => {
    try {
        const result = await notificationCore.deleteAllNotificationsCore(req.user);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

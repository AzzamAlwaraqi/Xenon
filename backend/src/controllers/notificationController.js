const notificationCore = require("../services/Core/notificationCore");

exports.sendNotification = async (req, res, next) => {
    try {
        const { recipientId, recipientRole, notificationData } = req.body;
        const result = await notificationCore.sendNotificationCore(recipientId, recipientRole, notificationData);
        return res.status(201).json({ status: "success", data: result });
    } catch (error) {
        next(error);
    }
};

exports.sendBroadcastNotification = async (req, res, next) => {
    try {
        const { recipientIds, targetRole, notificationData } = req.body;
        const result = await notificationCore.sendBroadcastNotificationCore(recipientIds, targetRole, notificationData);
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

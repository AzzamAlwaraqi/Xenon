const mongoose = require("mongoose");
const Notification = require("../../Models/NotificationModel"); 
const AppError = require("../../utils/AppError");
const { checkRole } = require("../../utils/checkvalidete"); 

exports.vendorSendUpdateCore = async function (vendorId, userId, type, message, session = null) {
    try {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const duplicateNotification = await Notification.findOne({
            user_id: userId,
            vendor_id: vendorId,
            notification_type: type,
            notification_message: message,
            createdAt: { $gte: oneMinuteAgo }
        });

        if (duplicateNotification) {
            console.log(`[Anti-Spam] Suppressed duplicate vendor notification for user ${userId}`);
            return duplicateNotification; 
        }

        const newNotification = await Notification.create([{
            user_id: userId,
            vendor_id: vendorId,
            notification_type: type,
            notification_message: message,
            is_read: false
        }], { session });

        if (global.io) {
            global.io.to(`user_${userId}`).emit('new_notification', {
                notification_id: newNotification[0]._id,
                notification_type: type,
                notification_message: message,
                vendor_id: vendorId,
                createdAt: new Date()
            });
        }

        return newNotification[0];
    } catch (error) {
        console.error("Failed to send vendor update notification:", error);
        return null; 
    }
};

exports.sendNotificationCore = async function (userId, vendorId, adminId, type, message, session = null) {
    try {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const duplicateNotification = await Notification.findOne({
            user_id: userId,
            vendor_id: vendorId,
            notification_type: type,
            createdAt: { $gte: oneMinuteAgo }
        });

        if (duplicateNotification) {
            console.log(`[Anti-Spam] Suppressed duplicate notification for user ${userId}`);
            return duplicateNotification; 
        }

        const payload = {
            user_id: userId,
            vendor_id: vendorId,
            notification_type: type,
            notification_message: message,
            is_read: false
        };
        
        if (adminId) payload.admin_id = adminId;

        const newNotification = await Notification.create([payload], { session });

        if (global.io) {
            let roomName = `user_${userId}`;
            global.io.to(roomName).emit('new_notification', {
                notification_id: newNotification[0]._id,
                notification_type: type,
                notification_message: message,
                createdAt: new Date()
            });
        }

        return newNotification[0];
    } catch (error) {
        console.error("Failed to send notification:", error);
        return null; 
    }
};

exports.sendBroadcastNotificationCore = async function (userIds, vendorId, type, message) {
    try {
        if (!userIds || userIds.length === 0) return null;

        const bulkNotifications = userIds.map(id => ({
            user_id: id,
            vendor_id: vendorId,
            notification_type: type,
            notification_message: message,
            is_read: false
        }));

        await Notification.insertMany(bulkNotifications);

        if (global.io) {
            global.io.to('all_users').emit('new_notification', {
                notification_type: type,
                notification_message: message,
                createdAt: new Date()
            });
        }

        return { status: "success", message: `Broadcasted to ${userIds.length} users` };
    } catch (error) {
        console.error("Failed to broadcast notification:", error);
        return null;
    }
};

exports.getMyNotificationsCore = async function (user) {
    try {
        let query = {};

        if (checkRole(user.role, ["vendor"])) {
            query = { vendor_id: user._id };
        } else if (checkRole(user.role, ["admin"])) {
            query = { admin_id: user._id };
        } else {
            query = { user_id: user._id };
        }

        const [notifications, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ is_read: 1, createdAt: -1 }) 
                .limit(20), 
            
            Notification.countDocuments({ ...query, is_read: false })
        ]);

        return {
            status: "success",
            unread_count: unreadCount,
            results: notifications.length,
            data: notifications
        };
    } catch (error) {
        throw new AppError(error.message, 500);
    }
};

exports.markAsReadCore = async function (user, notificationId) {
    try {
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            throw new AppError("Notification not found", 404);
        }

        // Access control check
        let isAuthorized = false;
        if (checkRole(user.role, ["admin"])) isAuthorized = true;
        if (checkRole(user.role, ["vendor"]) && notification.vendor_id && notification.vendor_id.toString() === user._id.toString()) isAuthorized = true;
        if (checkRole(user.role, ["user"]) && notification.user_id && notification.user_id.toString() === user._id.toString()) isAuthorized = true;

        if (!isAuthorized) {
            throw new AppError("Not authorized to modify this notification", 403);
        }

        if (notification.is_read) return { status: "success", message: "Already marked as read" };

        notification.is_read = true;
        await notification.save();

        if (global.io) {
            const roomName = checkRole(user.role, ["admin"]) ? 'admins_room' : `${user.role}_${user._id}`;
            global.io.to(roomName).emit('notification_read_sync', {
                notification_id: notificationId,
                action: 'decrement_badge'
            });
        }

        return { status: "success", message: "Marked as read" };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.markAllAsReadCore = async function (user) {
    try {
        let query = { is_read: false };
        if (checkRole(user.role, ["vendor"])) {
            query.vendor_id = user._id;
        } else if (checkRole(user.role, ["admin"])) {
            query.admin_id = user._id;
        } else {
            query.user_id = user._id;
        }

        const result = await Notification.updateMany(query, { 
            $set: { is_read: true } 
        });

        if (global.io && result.modifiedCount > 0) {
            const roomName = checkRole(user.role, ["admin"]) ? 'admins_room' : `${user.role}_${user._id}`;
            global.io.to(roomName).emit('notification_read_sync', {
                action: 'clear_badge'
            });
        }

        return { status: "success", message: `All notifications marked as read (${result.modifiedCount} updated)` };
    } catch (error) {
        throw new AppError(error.message, 500);
    }
};

exports.deleteNotificationCore = async function (user, notificationId) {
    try {
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            throw new AppError("Notification not found", 404);
        }

        // Access control check
        let isAuthorized = false;
        if (checkRole(user.role, ["admin"])) isAuthorized = true;
        if (checkRole(user.role, ["vendor"]) && notification.vendor_id && notification.vendor_id.toString() === user._id.toString()) isAuthorized = true;
        if (checkRole(user.role, ["user"]) && notification.user_id && notification.user_id.toString() === user._id.toString()) isAuthorized = true;

        if (!isAuthorized) {
            throw new AppError("Not authorized to delete this notification", 403);
        }

        await Notification.findByIdAndDelete(notificationId);

        return { status: "success", message: "Notification deleted" };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.deleteAllNotificationsCore = async function (user) {
    try {
        let query = {};
        if (checkRole(user.role, ["vendor"])) {
            query.vendor_id = user._id;
        } else if (checkRole(user.role, ["admin"])) {
            query.admin_id = user._id;
        } else {
            query.user_id = user._id;
        }

        const result = await Notification.deleteMany(query);

        return { status: "success", message: `All your notifications have been deleted (${result.deletedCount} deleted)` };
    } catch (error) {
        throw new AppError(error.message, 500);
    }
};
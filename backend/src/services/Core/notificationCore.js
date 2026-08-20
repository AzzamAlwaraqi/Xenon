const mongoose = require("mongoose");
const Notification = require("../../Models/NotificationModel"); 
const AppError = require("../../utils/AppError");
const { checkRole } = require("../../utils/checkvalidete"); 

exports.sendNotificationCore = async function (recipientId, recipientRole, notificationData, session = null) {
    try {
        const { title, message, type, related_entity_id } = notificationData;

        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const duplicateNotification = await Notification.findOne({
            recipient_id: recipientId,
            type: type,
            related_entity_id: related_entity_id || null,
            createdAt: { $gte: oneMinuteAgo },
            isDeleted: { $ne: true }
        });

        if (duplicateNotification) {
            console.log(`[Anti-Spam] Suppressed duplicate notification for user ${recipientId}`);
            return duplicateNotification; 
        }

        const newNotification = await Notification.create([{
            recipient_id: recipientId,
            recipient_role: recipientRole, 
            title: title,
            message: message,
            type: type, 
            related_entity_id: related_entity_id || null, 
            isRead: false
        }], { session });

        if (global.io) {
            let roomName = '';
            
            if (checkRole(recipientRole, ["admin"])) {
                roomName = 'admins_room';
            } else if (checkRole(recipientRole, ["vendor"])) {
                roomName = `vendor_${recipientId}`;
            } else {
                roomName = `user_${recipientId}`;
            }

            global.io.to(roomName).emit('new_notification', {
                notification_id: newNotification[0]._id,
                title: title,
                message: message,
                type: type,
                related_entity_id: related_entity_id,
                createdAt: new Date()
            });
        }

        // 🌟 4. FCM Push Notification Hook
        // TODO: check user.notification_preferences before sending FCM
        // if (recipientPushToken) { sendPushNotification(recipientPushToken, title, message); }

        return newNotification[0];
    } catch (error) {
        console.error("Failed to send notification:", error);
        return null; 
    }
};

exports.sendBroadcastNotificationCore = async function (recipientIds, targetRole, notificationData) {
    try {
        if (!recipientIds || recipientIds.length === 0) return null;

        const { title, message, type, related_entity_id } = notificationData;

        const bulkNotifications = recipientIds.map(id => ({
            recipient_id: id,
            recipient_role: targetRole,
            title,
            message,
            type,
            related_entity_id: related_entity_id || null,
            isRead: false
        }));

        await Notification.insertMany(bulkNotifications);

        if (global.io) {
            const roomName =  checkRole(targetRole, ["vendor"]) ? 'all_vendors' : 'all_users';
            global.io.to(roomName).emit('new_notification', {
                title,
                message,
                type,
                related_entity_id: related_entity_id || null,
                createdAt: new Date()
            });
        }

        return { status: "success", message: `Broadcasted to ${recipientIds.length} ${targetRole}s` };
    } catch (error) {
        console.error("Failed to broadcast notification:", error);
        return null;
    }
};

exports.getMyNotificationsCore = async function (user) {
    try {
        let query = { recipient_id: user._id, isDeleted: { $ne: true } };

        if (checkRole(user.role, ["admin"])) {
            query = { 
                $or: [
                    { recipient_id: user._id },
                    { recipient_role: 'admin' }
                ],
                isDeleted: { $ne: true }
            };
        }

        const [notifications, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ isRead: 1, createdAt: -1 }) 
                .limit(20), 
            
            Notification.countDocuments({ ...query, isRead: false })
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

        if (!notification || notification.isDeleted) {
            throw new AppError("Notification not found", 404);
        }

        if (notification.recipient_id && notification.recipient_id.toString() !== user._id.toString() && !checkRole(user.role, ["admin"])) {
            throw new AppError("Not authorized to modify this notification", 403);
        }

        if (notification.isRead) return { status: "success", message: "Already marked as read" };

        notification.isRead = true;
        notification.readAt = new Date();
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
        const query = checkRole(user.role, ["admin"]) 
            ? { $or: [{ recipient_id: user._id }, { recipient_role: 'admin' }], isRead: false, isDeleted: { $ne: true } }
            : { recipient_id: user._id, isRead: false, isDeleted: { $ne: true } };

        const result = await Notification.updateMany(query, { 
            $set: { isRead: true, readAt: new Date() } 
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

        if (!notification || notification.isDeleted) {
            throw new AppError("Notification not found", 404);
        }

        if (notification.recipient_id && notification.recipient_id.toString() !== user._id.toString() && !checkRole(user.role, ["admin"])) {
            throw new AppError("Not authorized to delete this notification", 403);
        }

        await Notification.findByIdAndUpdate(notificationId, {
            isDeleted: true,
            deletionRequestedAt: new Date()
        });

        return { status: "success", message: "Notification deleted" };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.deleteAllNotificationsCore = async function (user) {
    try {
        const query = checkRole(user.role, ["admin"]) 
            ? { $or: [{ recipient_id: user._id }, { recipient_role: 'admin' }], isDeleted: { $ne: true } }
            : { recipient_id: user._id, isDeleted: { $ne: true } };

        const result = await Notification.updateMany(query, { 
            $set: { isDeleted: true, deletionRequestedAt: new Date() } 
        });

        return { status: "success", message: `All your notifications have been deleted (${result.modifiedCount} updated)` };
    } catch (error) {
        throw new AppError(error.message, 500);
    }
};
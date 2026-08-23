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

exports.sendNotificationBroadcastCore = async (senderId, senderRole, notificationData) => {
    const { title, message, type, targetAudience } = notificationData;
    
    let targetUserIds = []; // 🌟 مصفوفة فارغة سنملؤها بناءً على رتبة المُرسِل

    // ==========================================
    // 1. تحديد الجمهور المستهدف (Audience Targeting)
    // ==========================================
    
    if (senderRole === 'admin') {
        // 👑 الإدارة (Admin): يحق له مراسلة كل النظام أو فئة محددة
        let query = { isActive: true };
        if (targetAudience === 'users_only') query.role = 'user';
        if (targetAudience === 'vendors_only') query.role = 'vendor';

        const users = await User.find(query).select('_id');
        targetUserIds = users.map(user => user._id);
        
    } else if (senderRole === 'vendor') {
        // 🏪 التاجر (Vendor): يحق له مراسلة عملائه فقط (سابقين أو حاليين)
        targetUserIds = await Booking.distinct("user_id", { 
            vendor_id: senderId,
            status: { $in: ["completed", "accepted", "pending"] } 
        });
    }

    // فحص أمان: هل يوجد جمهور فعلاً؟
    if (!targetUserIds || targetUserIds.length === 0) {
        throw new AppError("No valid audience found to send this broadcast.", 404);
    }

    // ==========================================
    // 2. التنفيذ المشترك (Shared Execution) - DRY 
    // ==========================================

    // تجهيز المصفوفة للإدخال المجمع
    const notificationsArray = targetUserIds.map(userId => ({
        user_id: userId,
        sender_id: senderId,
        vendor_id: senderRole === 'vendor' ? senderId : null, // إذا كان أدمن لن يكون هناك vendor_id
        notification_type: type || "broadcast",
        notification_message: message,
        title: title,
        is_read: false,
        createdAt: new Date()
    }));

    // الحفظ في قاعدة البيانات بضربة واحدة
    await Notification.insertMany(notificationsArray);

    // ==========================================
    // 3. الإشعارات اللحظية (Real-time Socket.io) 
    // ==========================================
    
    if (global.io) {
        // إرسال الإشعار اللحظي لغرف (Rooms) المستخدمين المستهدفين فقط
        targetUserIds.forEach(userId => {
            global.io.to(userId.toString()).emit('new_notification', {
                title: title,
                notification_type: type || "broadcast",
                notification_message: message,
                createdAt: new Date()
            });
        });
    }

    return {
        status: "success",
        message: `Broadcast successfully sent by ${senderRole} to ${targetUserIds.length} users.`,
        receiversCount: targetUserIds.length
    };
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
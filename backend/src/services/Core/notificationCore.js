const mongoose = require("mongoose");
const Notification = require("../../Models/NotificationModel"); 
const Booking = require("../../Models/BookingModel"); 
const User = require("../../Models/UserModel"); 
const AppError = require("../../utils/AppError");
const { checkRole } = require("../../utils/checkvalidete"); 

// 🌟 استدعاء إعدادات Firebase من مجلد Config
const admin = require("../../config/firebaseConfig"); 

// ==========================================
// 1. الإرسال الفردي (التحديثات المباشرة) + Firebase
// ==========================================
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

        // 1. إشعار لحظي داخلي (التطبيق مفتوح)
        if (global.io) {
            global.io.to(`user_${userId}`).emit('new_notification', {
                notification_id: newNotification[0]._id,
                notification_type: type,
                notification_message: message,
                vendor_id: vendorId,
                createdAt: new Date()
            });
        }

        // 2. إشعار خارجي عبر Firebase (التطبيق مغلق)
        const targetUser = await User.findById(userId).select('fcm_token');
        if (targetUser && targetUser.fcm_token && admin) {
            await admin.messaging().send({
                token: targetUser.fcm_token,
                notification: { title: "تحديث جديد من التاجر", body: message },
                data: { type: type || "update" }
            });
        }

        return newNotification[0];
    } catch (error) {
        console.error("Failed to send vendor update notification:", error);
        return null; 
    }
};

// ==========================================
// 🚀 2. البث الجماعي (Broadcast) - مع Firebase
// ==========================================
exports.sendNotificationBroadcastCore = async (senderId, senderRole, notificationData) => {
    const { title, message, type, targetAudience, packageId, bookingStatus } = notificationData;
    let targetUserIds = []; 

    if (senderRole === 'admin') {
        // 👑 الإدارة: بث عام
        let query = { isActive: true };
        if (targetAudience === 'users_only') query.role = 'user';
        if (targetAudience === 'vendors_only') query.role = 'vendor';
        const users = await User.find(query).select('_id');
        targetUserIds = users.map(user => user._id);
    } else if (senderRole === 'vendor') {
        // 🏪 التاجر: فلترة ذكية لعملائه
        let bookingQuery = { vendor_id: senderId };
        if (packageId) bookingQuery.package_id = packageId;
        if (bookingStatus) {
            bookingQuery.status = bookingStatus;
        } else {
            bookingQuery.status = { $in: ["completed", "accepted", "pending"] }; 
        }
        targetUserIds = await Booking.distinct("user_id", bookingQuery);
    }

    if (!targetUserIds || targetUserIds.length === 0) {
        throw new AppError("No valid audience found to send this broadcast.", 404);
    }

    // 1. الحفظ في MongoDB (ضربة واحدة)
    const notificationsArray = targetUserIds.map(userId => ({
        user_id: userId,
        sender_id: senderId,
        vendor_id: senderRole === 'vendor' ? senderId : null, 
        notification_type: type || "broadcast",
        notification_message: message,
        title: title,
        is_read: false,
        createdAt: new Date()
    }));
    await Notification.insertMany(notificationsArray);

    // 2. إشعارات Socket.io
    if (global.io) {
        targetUserIds.forEach(userId => {
            global.io.to(`user_${userId.toString()}`).emit('new_notification', { 
                title: title,
                notification_type: type || "broadcast",
                notification_message: message,
                createdAt: new Date()
            });
        });
    }

    // 3. إشعارات Firebase Cloud Messaging
    try {
        if (admin) {
            const usersWithTokens = await User.find({ _id: { $in: targetUserIds }, fcm_token: { $ne: null } }).select('fcm_token');
            const deviceTokens = usersWithTokens.map(u => u.fcm_token);
            
            if (deviceTokens.length > 0) {
                const payload = {
                    notification: { title: title || "إشعار جديد من منصة Xenon", body: message },
                    data: { type: type || "broadcast", click_action: "FLUTTER_NOTIFICATION_CLICK" },
                    tokens: deviceTokens
                };
                await admin.messaging().sendEachForMulticast(payload);
            }
        }
    } catch (firebaseError) {
        console.error("Firebase broadcast failed:", firebaseError);
    }

    return {
        status: "success",
        message: `Broadcast successfully sent to ${targetUserIds.length} target(s).`,
        receiversCount: targetUserIds.length
    };
};

// ==========================================
// 🚀 3. جلب الإشعارات (Pagination)
// ==========================================
exports.getMyNotificationsCore = async function (user, page = 1, limit = 20) {
    try {
        let query = {};
        if (checkRole(user.role, ["vendor"])) query.vendor_id = user._id;
        else if (checkRole(user.role, ["admin"])) query.admin_id = user._id;
        else query.user_id = user._id;

        const skip = (page - 1) * limit;

        const [notifications, unreadCount, totalCount] = await Promise.all([
            Notification.find(query).sort({ is_read: 1, createdAt: -1 }).skip(skip).limit(limit * 1), 
            Notification.countDocuments({ ...query, is_read: false }),
            Notification.countDocuments(query) 
        ]);

        return {
            status: "success",
            unread_count: unreadCount,
            total_notifications: totalCount,
            current_page: page * 1,
            total_pages: Math.ceil(totalCount / limit),
            results: notifications.length,
            data: notifications
        };
    } catch (error) {
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 🚀 4. مقروء (Atomic Update)
// ==========================================
exports.markAsReadCore = async function (user, notificationId) {
    try {
        let query = { _id: notificationId };
        
        if (!checkRole(user.role, ["admin"])) {
            if (checkRole(user.role, ["vendor"])) query.vendor_id = user._id;
            else query.user_id = user._id;
        }

        const notification = await Notification.findOneAndUpdate(query, { is_read: true }, { new: true });

        if (!notification) throw new AppError("Notification not found or you are not authorized to modify it", 404);

        if (global.io) {
            const roomName = checkRole(user.role, ["admin"]) ? 'admins_room' : `user_${user._id}`;
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

// ==========================================
// 5. قراءة الكل
// ==========================================
exports.markAllAsReadCore = async function (user) {
    try {
        let query = { is_read: false };
        if (checkRole(user.role, ["vendor"])) query.vendor_id = user._id;
        else if (checkRole(user.role, ["admin"])) query.admin_id = user._id;
        else query.user_id = user._id;

        const result = await Notification.updateMany(query, { $set: { is_read: true } });

        if (global.io && result.modifiedCount > 0) {
            const roomName = checkRole(user.role, ["admin"]) ? 'admins_room' : `user_${user._id}`;
            global.io.to(roomName).emit('notification_read_sync', { action: 'clear_badge' });
        }

        return { status: "success", message: `All notifications marked as read (${result.modifiedCount} updated)` };
    } catch (error) {
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 🚀 6. حذف إشعار (Atomic Delete)
// ==========================================
exports.deleteNotificationCore = async function (user, notificationId) {
    try {
        let query = { _id: notificationId };
        
        if (!checkRole(user.role, ["admin"])) {
            if (checkRole(user.role, ["vendor"])) query.vendor_id = user._id;
            else query.user_id = user._id;
        }

        const notification = await Notification.findOneAndDelete(query);

        if (!notification) throw new AppError("Notification not found or you are not authorized to delete it", 404);

        return { status: "success", message: "Notification deleted" };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 7. حذف الكل
// ==========================================
exports.deleteAllNotificationsCore = async function (user) {
    try {
        let query = {};
        if (checkRole(user.role, ["vendor"])) query.vendor_id = user._id;
        else if (checkRole(user.role, ["admin"])) query.admin_id = user._id;
        else query.user_id = user._id;

        const result = await Notification.deleteMany(query);

        return { status: "success", message: `All your notifications have been deleted (${result.deletedCount} deleted)` };
    } catch (error) {
        throw new AppError(error.message, 500);
    }
};
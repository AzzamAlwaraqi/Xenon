const mongoose = require("mongoose");
const Vendor = require("../../../Models/VendorModel");
const User = require("../../../Models/UserModel");
const AppError = require("../../../utils/AppError");
const APIFeatures = require("../../../utils/apiFeatures"); // تأكد من حالة الأحرف
const { checkRole, checkVendorStatus: checkvendorStatus } = require("../../../utils/checkvalidete");

// ==========================================
// 1. Get All Vendors (Admin Only)
// ==========================================
exports.getAllVendorsCore = async function (queryString, user) {
    try {
        // 🌟 الإصلاح: استخدام user.role
        if (!checkRole(user.role, ["admin"])) throw new AppError("Unauthorized", 403); 

        const features = new APIFeatures(
            Vendor.find().populate('user_id', 'name email mobileNumber -_id'), // 🌟 إخفاء _id
            queryString
        )
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const vendors = await features.query;
        
        return {
            status: "success",
            count: vendors.length,
            data: vendors
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 2. Update Approval Status
// ==========================================
exports.updateApprovalStatusCore = async function (vendorId, status, rejectionReason = null, user) {
    // 🌟 الإصلاح: استخدام user.role
    if (!checkRole(user.role, ["admin"])) throw new AppError("Unauthorized", 403); 
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const vendor = await Vendor.findById(vendorId).session(session);
        if (!vendor) {
            throw new AppError("No vendor found with that ID", 404);
        }
        
        const isApprovingDeletion = (vendor.approval_status === 'pending_deletion' && status === 'approved');

        if (vendor.approval_status === status && !isApprovingDeletion) {
            throw new AppError(`Vendor is already ${status}`, 400);
        }
        
        if (isApprovingDeletion) {
            vendor.approval_status = 'deleted';
            vendor.vendor_status = 'inactive';
        } else {
            vendor.approval_status = status;
        }

        vendor.action_by_admin = user._id;

        if (checkvendorStatus(status, ['rejected']) && rejectionReason) {
            vendor.rejection_reason = rejectionReason;
        } else {
            vendor.rejection_reason = undefined;
        }
        
        await vendor.save({ session });

        // 🌟 الإصلاح: تغيير الرتبة إلى 'user' بدلاً من 'client' لضمان توافق الداتابيز
        // (استخدمنا vendor.vendor_user_id لأنه الحقل المرجعي لليوزر حسب مشروعنا)
        const targetUserId = vendor.vendor_owner_id || vendor.vendor_user_id || vendor.user_id;

        if (status === 'approved' && !isApprovingDeletion) {
            await User.findByIdAndUpdate(targetUserId, { role: 'vendor' }, { session });
        } else if (checkvendorStatus(status, ['rejected', 'suspended', 'downgraded']) || isApprovingDeletion) {
            await User.findByIdAndUpdate(targetUserId, { role: 'user' }, { session });
            
            // تسجيل خروج اليوزر ومنعه من الدخول للويب 
            const SessionModel = require("../../../Models/SessionModel");
            await SessionModel.updateMany(
                { user_id: targetUserId, is_active: true },
                { is_active: false, session_status: 'terminated' },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();
        
        return vendor;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 3. Get Vendor Details
// ==========================================
exports.getVendorDetailsCore = async function (vendorId, user) {
    try {
        if (!checkRole(user.role, ["admin"])) throw new AppError("Unauthorized", 403); 
        
        const vendor = await Vendor.findById(vendorId)
            .populate('user_id', 'name email mobileNumber -_id'); // 🌟 تنظيف الـ Response
            
        if (!vendor) {
            throw new AppError("Vendor not found", 404);
        }
        
        return vendor;
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 4. Submit Downgrade Request (Internal Core)
// ==========================================
// 🌟 هذه هي الدالة التي طلبناها في ملف الـ Profile لحذف الفيندور والعودة كمستخدم
exports.submitDowngradeRequestCore = async function (data, session) {
    // تحديث حالة الموافقة لتصبح "قيد الإغلاق" لتظهر للآدمن في لوحة التحكم (Dashboard)
    await Vendor.findByIdAndUpdate(
        data.vendor_id, 
        { 
            approval_status: 'pending_deletion',
            rejection_reason: data.reason // استغلال حقل السبب لتوضيح نية الفيندور
        }, 
        { session }
    );
};
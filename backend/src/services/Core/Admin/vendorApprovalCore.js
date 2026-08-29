const mongoose = require("mongoose");
const Vendor = require("../../../Models/VendorModel");
const User = require("../../../Models/UserModel");
const AppError = require("../../../utils/AppError");
const APIFeatures = require("../../../utils/apiFeatures"); 
const { checkRole, checkVendorStatus: checkvendorStatus } = require("../../../utils/checkvalidete");

exports.getAllVendorsCore = async function (queryString, user) {
    try {

        if (!checkRole(user.role, ["admin"])) throw new AppError("Unauthorized", 403); 

        const features = new APIFeatures(
            Vendor.find().populate('owner_user_id', 'name email mobileNumber -_id'), 
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

exports.updateApprovalStatusCore = async function (vendorId, status, rejectionReason = null, user) {

    if (!checkRole(user.role, ["admin"])) throw new AppError("Unauthorized", 403); 
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const vendor = await Vendor.findById(vendorId).session(session);
        if (!vendor) {
            throw new AppError("No vendor found with that ID", 404);
        }
        
        const dbStatus = status === 'approved' ? 'active' : status;

        const isApprovingDeletion = (vendor.vendor_status === 'pending_deletion' && dbStatus === 'active');

        if (vendor.vendor_status === dbStatus && !isApprovingDeletion) {
            throw new AppError(`Vendor is already ${dbStatus}`, 400);
        }
        
        if (isApprovingDeletion) {
            vendor.vendor_status = 'inactive';
        } else {
            vendor.vendor_status = dbStatus;
        }

        vendor.action_by_admin = user._id;

        if (checkvendorStatus(dbStatus, ['rejected']) && rejectionReason) {
            vendor.rejection_reason = rejectionReason;
        } else {
            vendor.rejection_reason = undefined;
        }
        
        await vendor.save({ session });

        const targetUserId = vendor.owner_user_id;

        if (dbStatus === 'active' && !isApprovingDeletion) {
            await User.findByIdAndUpdate(targetUserId, { role: 'vendor' }, { session });
        } else if (checkvendorStatus(dbStatus, ['rejected', 'inactive']) || isApprovingDeletion) {
            await User.findByIdAndUpdate(targetUserId, { role: 'user' }, { session });
            
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

exports.getVendorDetailsCore = async function (vendorId, user) {
    try {
        if (!checkRole(user.role, ["admin"])) throw new AppError("Unauthorized", 403); 
        
        const vendor = await Vendor.findById(vendorId)
            .populate('owner_user_id', 'name email mobileNumber -_id'); 
            
        if (!vendor) {
            throw new AppError("Vendor not found", 404);
        }

        const VendorVerificationModel = require("../../../Models/VendorVerificationModel");
        const verification = await VendorVerificationModel.findOne({ vendor_id: vendorId, isDeleted: { $ne: true } });
        
        return {
            vendor,
            verification: verification || null
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.submitDowngradeRequestCore = async function (data, session) {

    await Vendor.findByIdAndUpdate(
        data.vendor_id, 
        { 
            approval_status: 'pending_deletion',
            rejection_reason: data.reason 
        }, 
        { session }
    );
};
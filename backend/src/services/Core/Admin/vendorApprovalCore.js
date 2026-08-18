const mongoose = require("mongoose");
const Vendor = require("../../../Models/VendorModel");
const AppError = require("../../../utils/AppError");
const APIFeatures = require("../../../utils/APIFeatures");
const checkRole = require("../../../utils/checkRole");
const checkvendorStatus = require("../../../utils/checkvendoraccess");
const User = require("../../../Models/UserModel");

exports.getAllVendors = async function (queryString, user) {
    if(!checkRole(user, ["admin"])) throw new AppError("Unauthorized", 403); 
    const features = new APIFeatures(Vendor.find().populate('user_id', 'name email mobileNumber'), queryString)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const vendors = await features.query;
    return vendors;
};

// ==========================================
// 2. update approval status (accepted , rejected , pending , suspended)
// ==========================================
exports.updateApprovalStatus = async function (vendorId, status, rejectionReason = null, user) {
    if (!checkRole(user, ["admin"])) throw new AppError("Unauthorized", 403); 
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const vendor = await Vendor.findById(vendorId).session(session);
        if (!vendor) {
            throw new AppError("No vendor found with that ID", 404);
        }
        if (vendor.approval_status === status) {
            throw new AppError(`Vendor is already ${status}`, 400);
        }
        vendor.approval_status = status;
        
        vendor.action_by_admin = user._id;

        if (checkvendorStatus(status, ['rejected']) && rejectionReason) {
            vendor.rejection_reason = rejectionReason;
        } else {
            vendor.rejection_reason = undefined;
        }
        await vendor.save({ session });
        if (status === 'approved') {
            await User.findByIdAndUpdate(vendor.user_id, { role: 'vendor' }, { session });
        } else if (checkvendorStatus(status, ['rejected', 'suspended'])) {
            await User.findByIdAndUpdate(vendor.user_id, { role: 'client' }, { session });
        }
        await session.commitTransaction();
        session.endSession();
        return vendor;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};
// ==========================================
// 3. get vendor details before accepting is must mandatory for admin
// ==========================================
exports.getVendorDetails = async function (vendorId, user) {
    if(!checkRole(user, ["admin"])) throw new AppError("Unauthorized", 403); 
    const vendor = await Vendor.findById(vendorId).populate('user_id', '-password');
    if (!vendor) {
        throw new AppError("Vendor not found", 404);
    }
    return vendor;
};
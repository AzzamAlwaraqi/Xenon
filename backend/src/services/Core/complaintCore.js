const sharp = require("sharp");
const AppError = require("../../utils/AppError");
const ComplaintModel = require("../../Models/ComplaintModel");
const FileStorageService = require("../Integration/FileStorageService");
const BookingModel = require("../../Models/BookingModel");
const checkRole = require("../../utils/checkRole");
const CheckStatus = require("../../utils/checkStatus");

// ==========================================
// 1. User Functions (العميل)
// ==========================================

exports.createComplaintCore = async function (user, complaintData, files) {
    try {
        const {
            complaint_type,
            complaint_title,
            complaint_message,
            complaint_priority,
            vendor_id,
            booking_id
        } = complaintData;

        if (booking_id) {
            const booking = await BookingModel.findById(booking_id);
            if (!booking || booking.user_id.toString() !== user._id.toString()) {
                throw new AppError("Invalid booking ID or you do not have permission to complain about this booking", 403);
            }
        }

        let attachments = [];

        if (files && files.length > 0) {
            const usernameFolder = user.username || user.name || user._id;
            const uploadPromises = files.map(async (file) => {
                const optimizedBuffer = await sharp(file.buffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer();

                const uploadResult = await FileStorageService.uploadImageFromBuffer(
                    optimizedBuffer,
                    `xenon/complaints/user/${usernameFolder}/${user._id}`
                );

                return {
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id
                };
            });

            attachments = await Promise.all(uploadPromises);
        }

        const newComplaint = await ComplaintModel.create({
            user_id: user._id,
            complaint_type,
            complaint_title,
            complaint_message,
            complaint_priority,
            vendor_id: vendor_id || null,
            booking_id: booking_id || null,
            attachments
        });

        if (global.io) {
            global.io.emit('new_complaint_alert', {
                complaint_id: newComplaint.complaint_id,
                priority: newComplaint.complaint_priority,
                username: user.username || user.name,
                message: `New ${complaint_priority} priority complaint submitted.`
            });
        }

        return newComplaint;

    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.getMyComplaintsCore = async function (user, queryParams = {}) {
    try {
        const query = {
            user_id: user._id,
            isDeleted: false
        };

        if (queryParams.status) query.complaint_status = queryParams.status;
        if (queryParams.priority) query.complaint_priority = queryParams.priority;
        if (queryParams.type) query.complaint_type = queryParams.type;

        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const complaints = await ComplaintModel.find(query)
            .populate('vendor_id', 'name vendor_email')
            .populate('booking_id', 'package_name startDate total_price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalComplaints = await ComplaintModel.countDocuments(query);

        return {
            status: "success",
            results: complaints.length,
            pagination: {
                total: totalComplaints,
                currentPage: page,
                limit: limit,
                totalPages: Math.ceil(totalComplaints / limit)
            },
            data: complaints
        };
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.getComplaintByIdCore = async function (user, complaintId) {
    try {
        const complaint = await ComplaintModel.findById(complaintId)
            .populate('user_id', 'name email mobileNumber')
            .populate('vendor_id', 'name vendor_email vendor_mobile')
            .populate('booking_id', 'package_name startDate endDate total_price');

        if (!complaint || complaint.isDeleted) {
            throw new AppError("Complaint not found", 404);
        }

        const isOwner = complaint.user_id._id.toString() === user._id.toString();
        const isTargetVendor = complaint.vendor_id && complaint.vendor_id._id.toString() === user._id.toString();
        const isAdmin = checkRole(user.role, ['admin']);

        if (!isOwner && !isTargetVendor && !isAdmin) {
            throw new AppError("You do not have permission to view this complaint", 403);
        }

        return {
            status: "success",
            data: complaint
        };
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.cancelComplaintCore = async function (user, complaintId) {
    try {
        const complaint = await ComplaintModel.findById(complaintId);

        if (!complaint || complaint.isDeleted) {
            throw new AppError("Complaint not found", 404);
        }

        if (complaint.user_id.toString() !== user._id.toString()) {
            throw new AppError("You are not authorized to cancel this complaint", 403);
        }

        if (complaint.complaint_status !== 'pending') {
            throw new AppError(`Cannot cancel a complaint that is already ${complaint.complaint_status}`, 400);
        }

        complaint.complaint_status = 'cancelled';
        complaint.isDeleted = true;
        complaint.deletionRequestedAt = new Date();

        await complaint.save();

        return {
            status: "success",
            message: "Complaint cancelled successfully",
            data: complaint
        };
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

// ==========================================
// 2. Admin & Vendor Functions (الإدارة والتاجر)
// ==========================================

exports.getAllComplaintsCore = async function (user, queryParams = {}) {
    try {
        if (!checkRole(user.role, ['admin'])) {
            throw new AppError("Unauthorized access. Admin role required.", 403);
        }

        let query = { isDeleted: false };

        if (queryParams.status) query.complaint_status = queryParams.status;
        if (queryParams.priority) query.complaint_priority = queryParams.priority;
        if (queryParams.type) query.complaint_type = queryParams.type;
        if (queryParams.vendor_id) query.vendor_id = queryParams.vendor_id;

        if (queryParams.search) {
            query.complaint_id = { $regex: queryParams.search, $options: 'i' };
        }

        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const complaints = await ComplaintModel.find(query)
            .populate('user_id', 'name email')
            .populate('vendor_id', 'name vendor_email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalComplaints = await ComplaintModel.countDocuments(query);

        return {
            status: "success",
            results: complaints.length,
            pagination: {
                total: totalComplaints,
                currentPage: page,
                limit: limit,
                totalPages: Math.ceil(totalComplaints / limit)
            },
            data: complaints
        };
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.respondToComplaintCore = async function (user, complaintId, responseData) {
    try {
        if (!checkRole(user.role, ['admin'])) {
            throw new AppError("Unauthorized access. Admin role required.", 403);
        }

        const { status, admin_response } = responseData;

        if (status && !CheckStatus(status)) {
            throw new AppError("Invalid complaint status update", 400);
        }

        const complaint = await ComplaintModel.findById(complaintId);

        if (!complaint || complaint.isDeleted) {
            throw new AppError("Complaint not found", 404);
        }

        if (status) complaint.complaint_status = status;
        if (admin_response) complaint.admin_response = admin_response;

        await complaint.save();

        if (global.io) {
            global.io.emit(`complaint_update_${complaint.user_id}`, {
                complaint_id: complaint.complaint_id,
                status: complaint.complaint_status,
                message: "Your complaint status has been updated by the administration."
            });
        }

        return {
            status: "success",
            message: "Complaint updated successfully",
            data: complaint
        };
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.getComplaintsAgainstMeCore = async function (user, queryParams = {}) {
    try {
        if (!checkRole(user.role, ['vendor'])) {
            throw new AppError("Unauthorized access. Vendor role required.", 403);
        }

        const query = {
            vendor_id: user._id,
            isDeleted: false
        };

        if (queryParams.status) query.complaint_status = queryParams.status;
        if (queryParams.priority) query.complaint_priority = queryParams.priority;

        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const complaints = await ComplaintModel.find(query)
            .populate('booking_id', 'package_name startDate')
            .select('-user_id')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalComplaints = await ComplaintModel.countDocuments(query);

        return {
            status: "success",
            results: complaints.length,
            pagination: {
                total: totalComplaints,
                currentPage: page,
                limit: limit,
                totalPages: Math.ceil(totalComplaints / limit)
            },
            data: complaints
        };
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};
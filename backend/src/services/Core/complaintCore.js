const mongoose = require("mongoose");
const sharp = require("sharp");
const AppError = require("../../utils/AppError");
const ComplaintModel = require("../../Models/ComplaintModel");
const BookingModel = require("../../Models/BookingModel");
const FileStorageService = require("../Integration/FileStorageService");
const { checkRole, checkStatus } = require("../../utils/checkvalidete"); 

exports.createComplaintCore = async function (user, complaintData, files) {
    let attachments = []; 

    try {
        const {
            complaint_type,
            complaint_title,
            complaint_message,
        
            complaint_priority,
            vendor_id,
            booking_id
        } = complaintData;

        let finalVendorId = null;

        if (booking_id) {
            const booking = await BookingModel.findById(booking_id);
            if (!booking || booking.user_id.toString() !== user._id.toString()) {
                throw new AppError("Invalid booking ID or you do not have permission to complain about this booking", 403);
            }
            
            finalVendorId = booking.vendor_id;

            const existingComplaint = await ComplaintModel.findOne({
                user_id: user._id,
                booking_id: booking_id,
                complaint_status: { $in: ['pending', 'in_progress'] },
                isDeleted: false
            });

            if (existingComplaint) {
                throw new AppError("You already have an active complaint for this booking. Please wait for the admin to resolve it.", 409);
            }
        } else if (complaintData.vendor_id) {
            // If complaining directly against a vendor without a specific booking
            const mongoose = require("mongoose");
            const VendorModel = mongoose.model("Vendor");
            const vendorExists = await VendorModel.findById(complaintData.vendor_id);
            if (!vendorExists) {
                throw new AppError("Vendor not found", 404);
            }
            finalVendorId = complaintData.vendor_id;
        }

        if (files && files.length > 0) {
            const usernameFolder = user.company_name || user.vendor_name || user.name || 'User';
            const uploadPromises = files.map(async (file, index) => {
                const optimizedBuffer = await sharp(file.buffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer();

                const uniquePath = `xenon/complaints/user/${usernameFolder}/${user._id}_${Date.now()}_${index}`;
                const uploadResult = await FileStorageService.uploadImageFromBuffer(optimizedBuffer, uniquePath);

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
            complaint_priority: complaint_priority || 'medium',
            vendor_id: finalVendorId, 
            booking_id: booking_id || null,
            attachments
        });

        if (global.io) {
            global.io.to('admins_room').emit('new_complaint_alert', {
                complaint_id: newComplaint._id,
                priority: newComplaint.complaint_priority,
                username: user.name,
                message: `New ${newComplaint.complaint_priority} priority complaint submitted.`
            });
            
            if (finalVendorId) {
                global.io.to(`vendor_${finalVendorId}`).emit('complaint_received', {
                    message: "A new complaint has been filed regarding your services. Admin will review it."
                });
            }
        }

        return {
            status: "success",
            message: "Complaint submitted successfully.",
            data: newComplaint
        };

    } catch (error) {
        if (attachments && attachments.length > 0) {
            for (const file of attachments) {
                await FileStorageService.deleteImage(file.public_id).catch(e => 
                    console.error("Critical: Failed to clean up orphaned image:", e)
                );
            }
        }
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.getMyComplaintsCore = async function (user, queryParams = {}) {
    try {
        const query = { user_id: user._id, isDeleted: false };

        if (queryParams.status) query.complaint_status = queryParams.status;
        if (queryParams.priority) query.complaint_priority = queryParams.priority;
        if (queryParams.type) query.complaint_type = queryParams.type;

        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const [complaints, totalComplaints] = await Promise.all([
            ComplaintModel.find(query)
                .populate('vendor_id', 'vendor_name company_name vendor_email -_id')
                .populate('booking_id', 'package_name startDate total_price -_id')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ComplaintModel.countDocuments(query)
        ]);

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
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.getComplaintByIdCore = async function (user, complaintId) {
    try {
        const rawComplaint = await ComplaintModel.findById(complaintId);
        
        if (!rawComplaint || rawComplaint.isDeleted) {
            throw new AppError("Complaint not found", 404);
        }

        const isOwner = rawComplaint.user_id.toString() === user._id.toString();
        const isTargetVendor = rawComplaint.vendor_id && rawComplaint.vendor_id.toString() === user._id.toString();
        const isAdmin = checkRole(user.role, ['admin']);

        if (!isOwner && !isTargetVendor && !isAdmin) {
            throw new AppError("You do not have permission to view this complaint", 403);
        }

        const complaint = await ComplaintModel.findById(complaintId)
            .populate('user_id', 'name email mobileNumber -_id')
            .populate('vendor_id', 'vendor_name vendor_email vendor_mobile -_id')
            .populate('booking_id', 'package_name startDate endDate total_price -_id');

        return { status: "success", data: complaint };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
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
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.getAllComplaintsCore = async function (user, queryParams = {}) {
    try {
        if (!checkRole(user.role, ['admin', 'vendor', 'company'])) {
            throw new AppError("Unauthorized access. Admin or Vendor role required.", 403);
        }

        let query = { isDeleted: false };

        if (checkRole(user.role, ['vendor', 'company'])) {
            query.vendor_id = user._id; // Force filter for vendors
        } else if (queryParams.vendor_id) {
            query.vendor_id = queryParams.vendor_id; // Admins can optionally filter
        }

        if (queryParams.status) query.complaint_status = queryParams.status;
        if (queryParams.priority) query.complaint_priority = queryParams.priority;
        if (queryParams.type) query.complaint_type = queryParams.type;

        if (queryParams.search) {
            query.$or = [
                { _id: { $regex: queryParams.search, $options: 'i' } },
                { complaint_title: { $regex: queryParams.search, $options: 'i' } }
            ];
        }

        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const [complaints, totalComplaints] = await Promise.all([
            ComplaintModel.find(query)
                .populate('user_id', 'name email -_id')
                .populate('vendor_id', 'vendor_name vendor_email -_id')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ComplaintModel.countDocuments(query)
        ]);

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
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.respondToComplaintCore = async function (user, complaintId, responseData) {
    try {
        console.log("DEBUG: user.role is =>", user.role);
        
        if (!checkRole(user.role, ['admin', 'vendor'])) {
            throw new AppError(`Unauthorized access. Your role is: ${user.role}. Admin or Vendor role required.`, 403);
        }

        const { status, admin_response, reply } = responseData;

        if (status && !checkStatus(status, ['pending', 'in_progress', 'resolved', 'cancelled'])) {
            throw new AppError("Invalid complaint status update", 400);
        }

        const complaint = await ComplaintModel.findById(complaintId);

        if (!complaint || complaint.isDeleted) {
            throw new AppError("Complaint not found", 404);
        }
        
        if (checkRole(user.role, ['vendor'])) {
            console.log('DEBUG: complaint.vendor_id =', complaint.vendor_id?.toString());
            console.log('DEBUG: user._id =', user._id.toString());
            if (complaint.vendor_id?.toString() !== user._id.toString()) {
                throw new AppError(`You can only respond to complaints related to your packages. (Complaint vendor: ${complaint.vendor_id}, Your user_id: ${user._id})`, 403);
            }
        }

        if (status) complaint.complaint_status = status;
        if (admin_response && checkRole(user.role, ['admin'])) complaint.admin_response = admin_response;
        if (reply) complaint.reply = reply;

        await complaint.save();

        if (global.io) {
            global.io.to(`user_${complaint.user_id}`).emit('complaint_update', {
                complaint_id: complaint._id,
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
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.getComplaintsAgainstMeCore = async function (user, queryParams = {}) {
    try {
        if (!checkRole(user.role, ['vendor'])) {
            throw new AppError("Unauthorized access. Vendor role required.", 403);
        }

        const query = { vendor_id: user._id, isDeleted: false };

        if (queryParams.status) query.complaint_status = queryParams.status;
        if (queryParams.priority) query.complaint_priority = queryParams.priority;

        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const [complaints, totalComplaints] = await Promise.all([
            ComplaintModel.find(query)
                .populate('booking_id', 'package_name startDate -_id')
                .select('-user_id') 
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ComplaintModel.countDocuments(query)
        ]);

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
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.vendorReplyToComplaintCore = async function (user, complaintId, replyText) {
    try {
        if (!checkRole(user.role, ['vendor'])) {
            throw new AppError("Unauthorized access. Vendor role required.", 403);
        }

        const complaint = await ComplaintModel.findById(complaintId);

        if (!complaint || complaint.isDeleted) {
            throw new AppError("Complaint not found", 404);
        }

        if (complaint.vendor_id.toString() !== user._id.toString()) {
            throw new AppError("You can only reply to complaints directed at your services.", 403);
        }

        complaint.vendor_reply = replyText;
        complaint.vendor_replied_at = new Date();
        
        await complaint.save();

        if (global.io) {
            global.io.to(`user_${complaint.user_id}`).emit('vendor_reply_received', {
                complaint_id: complaint._id,
                vendor_name: user.company_name || user.vendor_name || user.name,
                message: "The vendor has replied to your complaint.",
                reply: replyText
            });
        }

        return {
            status: "success",
            message: "Your reply has been sent successfully to the user.",
            data: complaint
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};
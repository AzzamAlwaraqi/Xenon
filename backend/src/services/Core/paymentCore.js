const mongoose = require("mongoose");
const sharp = require("sharp");
const FileStorageService = require("../../service/integration/FileStorageService"); 
const VendorSubscription = require("../../Models/VendorSubscriptionModels");
const BookingPayment = require("../../Models/BookingPaymentModels");
const User = require("../../Models/UserModel");
const Booking = require("../../Models/BookingModel");
const Package = require("../../Models/PackageModel"); // 🌟 أضفنا مودل الباقة
const AppError = require("../../utils/AppError");
const { checkRole } = require("../../utils/checkvalidete");
const filterObj = require("../../utils/updatepayment");

const getVendorId = (user) => {
    return user.vendor_id || user._id;
};

// ==========================================
// 1. ADD BOOKING PAYMENT
// ==========================================
exports.addBookingPaymentCore = async function (user, paymentData, file) {
    let uploadedImagePublicId = null; 
    let receiptImageObj = undefined; 
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!checkRole(user.role, ['vendor'])) {
            throw new AppError("Only office employees are authorized to enter and record payments for bookings", 403);
        }

        const customer = await User.findOne({ mobileNumber: paymentData.customer_phone, role: 'user' }).session(session);
        if (!customer) throw new AppError("Customer not found. Please check the phone number", 404);

        if (customer._id.toString() === user._id.toString()) {
            throw new AppError("You cannot enter and confirm a payment for a booking that belongs to you personally.", 403);
        }

        const booking = await Booking.findById(paymentData.booking_id).session(session);
        if (!booking || booking.isDeleted) throw new AppError("Booking not found", 404);

        if (booking.user_id.toString() !== customer._id.toString()) {
            throw new AppError("This booking does not belong to the mentioned customer", 400);
        }

        const vendorId = getVendorId(user);
        if (booking.vendor_id.toString() !== vendorId.toString()) {
            throw new AppError("This booking belongs to another office and you cannot receive its payments", 403);
        }

        // 🌟 1. الحماية الزمنية: التأكد من عدم انتهاء المهلة (48 ساعة)
        if (booking.status === 'pending_payment' && booking.payment_deadline && booking.payment_deadline < new Date()) {
            booking.status = 'cancelled';
            booking.status_history.push({ status: 'cancelled', changed_by: user._id, changed_at: Date.now() });
            await booking.save({ session });
            throw new AppError("The payment deadline (48h) for this booking has expired. The booking has been automatically cancelled.", 400);
        }

        // 🌟 2. حماية المقاعد: إذا الحجز مش مؤكد، نأكده ونخصم المقاعد الآن
        if (booking.status === 'pending_payment') {
            const packageDoc = await Package.findById(booking.package_id).session(session);
            if (!packageDoc || packageDoc.available_seats < booking.number_of_people) {
                throw new AppError("Cannot process payment! Seats have been taken by others while waiting.", 400);
            }
            // خصم المقاعد
            packageDoc.available_seats -= booking.number_of_people;
            await packageDoc.save({ session });
            
            // تحديث حالة الحجز
            booking.status = 'accepted';
            booking.status_history.push({ status: 'accepted', changed_by: user._id, changed_at: Date.now() });
            await booking.save({ session });
        }

        const requiresImage = paymentData.payment_method === 'CliQ';
        
        if (requiresImage) {
            if (!file) throw new AppError(`A receipt image is required when the payment method is ${paymentData.payment_method}`, 400);

            const optimizedBuffer = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            const vendorName = user.company_name || user.vendor_name || user.name || 'Vendor';
            const safeVendorName = vendorName.replace(/[^a-zA-Z0-9]/g, '_');
            const safeUserName = (user.name || 'Emp').replace(/[^a-zA-Z0-9]/g, '_');
            const today = new Date();
            const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
            
            // 🌟 تم إصلاح الـ Path عشان ما يضرب undefined
            const uploadPath = `xenon/payments/booking/${safeVendorName}/${safeUserName}/${formattedDate}`;
            const uploadResult = await FileStorageService.uploadImageFromBuffer(optimizedBuffer, uploadPath);
            
            uploadedImagePublicId = uploadResult.public_id; 

            receiptImageObj = {
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id
            };
        }

        const newPayment = await BookingPayment.create([{
            user_id: customer._id,
            vendor_id: vendorId,
            booking_id: booking._id,
            amount: paymentData.amount,
            currency: paymentData.currency || 'JOD',
            payment_method: paymentData.payment_method,
            payment_status: 'Verified',
            payment_description: paymentData.payment_description || "Booking Payment",
            receipt_image: receiptImageObj,
            verified_by: user._id,
            verified_at: Date.now(),
            isDeleted: false
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return newPayment[0];
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        if (uploadedImagePublicId) {
            await FileStorageService.deleteImage(uploadedImagePublicId).catch(e => console.error("Cloud cleanup failed:", e));
        }

        if (error.statusCode) throw error;
        throw new AppError(error.message || "An error occurred while saving the payment", 500);
    }
};

// ==========================================
// 2. GET BOOKING PAYMENTS
// ==========================================
exports.getBookingPaymentsCore = async function (user, query) {
    let filter = { ...query };

    if (filter.isDeleted === undefined) {
        filter.isDeleted = false;
    }

    if (checkRole(user.role, ['user'])) {
        filter.user_id = user._id;
    } else if (checkRole(user.role, ['vendor'])) {
        filter.vendor_id = getVendorId(user);
    } else if (!checkRole(user.role, ['admin'])) {
        throw new AppError("Rejected permission to get booking payments", 403);
    }

    const payments = await BookingPayment.find(filter)
        .populate('user_id', 'name mobileNumber email')
        .populate('verified_by', 'name role');

    return payments;
};

// ==========================================
// 3. UPDATE BOOKING PAYMENT
// ==========================================
exports.updateBookingPaymentCore = async function (user, paymentId, updateData) {
    if (!checkRole(user.role, ['vendor'])) {
        throw new AppError("Rejected permission to update payment", 403);
    }

    const payment = await BookingPayment.findById(paymentId);
    if (!payment) throw new AppError("Payment not found", 404);

    const vendorId = getVendorId(user);
    if (payment.vendor_id.toString() !== vendorId.toString()) {
        throw new AppError("This payment belongs to another office", 403);
    }

    if (payment.payment_status === 'Verified' && updateData.amount !== undefined) {
        throw new AppError("Cannot edit financial value of a verified payment. Cancel and re-enter", 400);
    }

    const safeUpdateData = filterObj(
        updateData, 
        'amount', 
        'currency', 
        'payment_method', 
        'payment_status', 
        'payment_description'
    );

    if (Object.keys(safeUpdateData).length === 0) {
        throw new AppError("No valid fields provided for update", 400);
    }

    const updatedPayment = await BookingPayment.findByIdAndUpdate(
        paymentId,
        { $set: safeUpdateData },
        { new: true, runValidators: true }
    );
    
    return updatedPayment;
};

// ==========================================
// 4. DELETE BOOKING PAYMENT
// ==========================================
exports.deleteBookingPaymentCore = async function (user, paymentId) {
    if (!checkRole(user.role, ['vendor'])) {
        throw new AppError("Rejected permission to delete payment", 403);
    }

    const payment = await BookingPayment.findById(paymentId);
    if (!payment) throw new AppError("Payment not found", 404);

    const vendorId = getVendorId(user);
    if (payment.vendor_id.toString() !== vendorId.toString()) {
        throw new AppError("Cannot delete payment of another office", 403);
    }

    await BookingPayment.updateOne(
        { _id: paymentId },
        {
            isDeleted: true,
            payment_status: 'Cancelled',
            deleted_by: user._id,
            deleted_at: Date.now()
        }
    );

    return { message: "Deleted booking payment successfully" };
};

// ==========================================
// 5. ADD VENDOR SUBSCRIPTION PAYMENT
// ==========================================
exports.addVendorSubscriptionPaymentCore = async function (user, paymentData, file) {
    let uploadedImagePublicId = null;
    let receiptImageObj = undefined;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!checkRole(user.role, ['admin'])) {
            throw new AppError("Only the administration has the authority to record and approve office subscriptions", 403);
        }

        const vendorId = paymentData.vendor_id;
        const requiresImage = paymentData.payment_method === 'CliQ';
        
        if (requiresImage) {
            if (!file) throw new AppError(`A receipt image is required when the payment method is ${paymentData.payment_method}`, 400);

            const optimizedBuffer = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            const safeVendorName = (user.company_name || 'Vendor').replace(/[^a-zA-Z0-9]/g, '_');
            const safeUserName = (user.name || 'Admin').replace(/[^a-zA-Z0-9]/g, '_');
            const today = new Date();
            const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
            
            // 🌟 تصليح الـ Path
            const uploadPath = `xenon/payments/subscription/vendor_${safeVendorName}/${safeUserName}/${formattedDate}`;
            const uploadResult = await FileStorageService.uploadImageFromBuffer(optimizedBuffer, uploadPath);
            
            uploadedImagePublicId = uploadResult.public_id; 

            receiptImageObj = {
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id
            };
        }

        const activeSubscription = await VendorSubscription.findOne({
            vendor_id: vendorId,
            subscription_status: 'Active',
            isDeleted: false
        }).session(session);

        let startDate = Date.now();
        if (activeSubscription && activeSubscription.subscription_end_date > startDate) {
            startDate = activeSubscription.subscription_end_date;
        }

        const durationDays = 30;
        const endDate = new Date(new Date(startDate).getTime() + durationDays * 24 * 60 * 60 * 1000);

        const newSub = await VendorSubscription.create([{
            vendor_id: vendorId,
            amount: paymentData.amount,
            currency: paymentData.currency || 'JOD',
            payment_method: paymentData.payment_method,
            payment_status: 'Verified',
            subscription_start_date: startDate,
            subscription_end_date: endDate,
            subscription_status: 'Active',
            receipt_image: receiptImageObj,
            verified_by: user._id,
            verified_at: Date.now(),
            isDeleted: false
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return newSub[0];
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        if (uploadedImagePublicId) {
            await FileStorageService.deleteImage(uploadedImagePublicId).catch(e => console.error("Cloud cleanup failed:", e));
        }

        if (error.statusCode) throw error;
        throw new AppError(error.message || "An error occurred while saving the subscription", 500);
    }
};

// ==========================================
// 6. GET VENDOR SUBSCRIPTION PAYMENTS
// ==========================================
exports.getVendorSubscriptionPaymentsCore = async function (user, query) {
    let filter = { ...query };

    if (filter.isDeleted === undefined) {
        filter.isDeleted = false;
    }

    if (checkRole(user.role, ['vendor'])) {
        filter.vendor_id = getVendorId(user);
    } else if (!checkRole(user.role, ['admin'])) {
        throw new AppError("Rejected permission to view subscriptions", 403);
    }

    const subscriptions = await VendorSubscription.find(filter)
        .populate('vendor_id', 'vendor_name vendor_email')
        .populate('verified_by', 'name');

    return subscriptions;
};

// ==========================================
// 7. UPDATE VENDOR SUBSCRIPTION
// ==========================================
exports.updateVendorSubscriptionPaymentCore = async function (user, paymentId, updateData) {
    if (!checkRole(user.role, ['admin'])) {
        throw new AppError("Only the administration has the authority to modify subscription data", 403);
    }

    const safeUpdateData = filterObj(
        updateData,
        'amount',
        'currency',
        'payment_method',
        'payment_status',
        'subscription_start_date',
        'subscription_end_date',
        'subscription_status'
    );

    if (Object.keys(safeUpdateData).length === 0) {
        throw new AppError("No valid fields provided for update", 400);
    }

    const updatedSub = await VendorSubscription.findByIdAndUpdate(
        paymentId,
        { $set: safeUpdateData },
        { new: true, runValidators: true }
    );

    if (!updatedSub) throw new AppError("Subscription not found", 404);
    
    return updatedSub;
};

// ==========================================
// 8. DELETE VENDOR SUBSCRIPTION
// ==========================================
exports.deleteVendorSubscriptionPaymentCore = async function (user, paymentId) {
    if (!checkRole(user.role, ['admin'])) {
        throw new AppError("Rejected permission to delete subscription", 403);
    }

    const subscription = await VendorSubscription.findById(paymentId);
    if (!subscription) throw new AppError("Subscription not found", 404);

    await VendorSubscription.updateOne(
        { _id: paymentId },
        {
            isDeleted: true,
            payment_status: 'Cancelled',
            subscription_status: 'Suspended',
            deleted_by: user._id,
            deleted_at: Date.now()
        }
    );

    return { message: "Deleted subscription successfully" };
};

// ==========================================
// 9. FINANCIAL STATEMENTS
// ==========================================
exports.getCustomerFinancialStatementCore = async function (user, customerPhone) {
    if (!checkRole(user.role, ['vendor'])) {
        throw new AppError("Not authorized to extract customer statement of account", 403);
    }

    const customer = await User.findOne({ mobileNumber: customerPhone, role: 'user' });
    if (!customer) throw new AppError("Customer not found", 404);

    const vendorId = getVendorId(user);
    const customerId = customer._id;

    const paymentsHistory = await BookingPayment.find({
        user_id: customerId,
        vendor_id: vendorId,
        isDeleted: false
    }).sort({ createdAt: -1 });

    const bookingsHistory = await Booking.find({
        user_id: customerId,
        vendor_id: vendorId,
        status: { $in: ['accepted', 'completed'] } 
    });

    let totalRequired = 0;
    bookingsHistory.forEach(b => totalRequired += (b.total_price || 0));

    let totalPaid = 0;
    paymentsHistory.forEach(p => {
        if (p.payment_status === 'Verified') totalPaid += p.amount;
    });

    const remainingBalance = totalRequired - totalPaid;

    return {
        customer_info: {
            name: customer.name,
            phone: customer.mobileNumber
        },
        financial_summary: {
            total_required: totalRequired,
            total_paid: totalPaid,
            remaining_balance: remainingBalance
        },
        payments_history: paymentsHistory,
    };
};

exports.getVendorFinancialStatementCore = async function (user, targetVendorId) {
    if (checkRole(user.role, ['admin'])) {
        if (!targetVendorId) {
            throw new AppError("Please specify the office you want to extract the statement of account for", 400);
        }
    } else if (checkRole(user.role, ['vendor'])) {
        targetVendorId = getVendorId(user);
    } else {
        throw new AppError("Not authorized to extract this statement", 403);
    }

    const subscriptionHistory = await VendorSubscription.find({
        vendor_id: targetVendorId,
        isDeleted: false
    }).sort({ createdAt: -1 }); 

    let totalPaid = 0;
    let pendingPaymentsCount = 0;
    let lastActiveSubscription = null;

    subscriptionHistory.forEach(sub => {
        if (sub.payment_status === 'Verified') {
            totalPaid += sub.amount;
            if (!lastActiveSubscription || sub.subscription_end_date > lastActiveSubscription.subscription_end_date) {
                lastActiveSubscription = sub;
            }
        } else if (sub.payment_status === 'Pending') {
            pendingPaymentsCount++;
        }
    });

    let accountStatus = 'Inactive';
    let daysRemaining = 0;

    if (lastActiveSubscription && lastActiveSubscription.subscription_end_date > Date.now()) {
        accountStatus = 'Active';
        const diffTime = Math.abs(lastActiveSubscription.subscription_end_date - Date.now());
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
        financial_summary: {
            total_subscriptions_paid: totalPaid,
            pending_requests: pendingPaymentsCount,
            current_status: accountStatus,
            days_remaining: daysRemaining,
            expiry_date: lastActiveSubscription ? lastActiveSubscription.subscription_end_date : null
        },
        subscriptions_history: subscriptionHistory
    };
};
const VendorSubscription = require("../../Models/VendorSubscriptionModels");
const BookingPayment = require("../../Models/BookingPaymentModels");
const User = require("../../Models/UserModel");
const Booking = require("../../Models/BookingModel");
const AppError = require("../../utils/AppError");
const { checkRole } = require("../../utils/checkvalidete");

const getVendorId = (user) => {
    return user.vendor_id || user._id;
};

exports.addBookingPaymentCore = async function (user, paymentData) {
    if (!checkRole(user.role, ['vendor'])) {
        throw new AppError("Only office employees are authorized to enter and record payments for bookings", 403);
    }

    const customer = await User.findOne({ mobileNumber: paymentData.customer_phone, role: 'user' });
    if (!customer) {
        throw new AppError("Customer not found. Please check the phone number", 404);
    }

    if (customer._id.toString() === user._id.toString()) {
        throw new AppError("You cannot enter and confirm a payment for a booking that belongs to you personally. Please review another employee", 403);
    }

    const booking = await Booking.findById(paymentData.booking_id);
    if (!booking) throw new AppError("Booking not found", 404);

    if (booking.user_id.toString() !== customer._id.toString()) {
        throw new AppError("This booking does not belong to the mentioned customer", 400);
    }

    const vendorId = getVendorId(user);
    if (booking.vendor_id.toString() !== vendorId.toString()) {
        throw new AppError("This booking belongs to another office and you cannot receive its payments", 403);
    }

    paymentData.user_id = customer._id;
    paymentData.vendor_id = vendorId;
    paymentData.payment_status = 'Verified';
    paymentData.verified_by = user._id;
    paymentData.verified_at = Date.now();
    paymentData.isDeleted = false;

    const newPayment = await BookingPayment.create(paymentData);
    return newPayment;
};

exports.getBookingPaymentsCore = async function (user, query) {
    let filter = { ...query };

    if (filter.isDeleted === undefined) {
        filter.isDeleted = false;
    }

    if (user.role === 'user') {
        filter.user_id = user._id;
    } else if (checkRole(user.role, ['vendor'])) {
        filter.vendor_id = getVendorId(user);
    } else if (user.role === 'admin') {
        // admins can see all payments
    } else {
        throw new AppError("Rejected permission to get booking payments", 403);
    }

    const payments = await BookingPayment.find(filter)
        .populate('user_id', 'name mobileNumber email')
        .populate('verified_by', 'name role');

    return payments;
};

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

    if (payment.payment_status === 'Verified' && updateData.amount) {
        throw new AppError("Cannot edit financial value of a verified payment. Cancel and re-enter", 400);
    }

    delete updateData.user_id;
    delete updateData.vendor_id;
    delete updateData.booking_id;
    delete updateData.isDeleted;

    const updatedPayment = await BookingPayment.findByIdAndUpdate(
        paymentId,
        updateData,
        { new: true, runValidators: true }
    );
    return updatedPayment;
};

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

    if (payment.user_id.toString() === user._id.toString()) {
        throw new AppError("Cannot delete payment of yourself", 403);
    }

    payment.isDeleted = true;

    payment.payment_metadata = payment.payment_metadata || {};
    payment.payment_metadata.deleted_by = user._id;
    payment.payment_metadata.deleted_at = Date.now();

    await payment.save();
    return { message: "Deleted booking payment successfully" };
};

exports.addVendorSubscriptionPaymentCore = async function (user, paymentData) {
    if (!checkRole(user.role, ['admin'])) {
        throw new AppError("Only the administration has the authority to record and approve office subscriptions", 403);
    }

    const vendorId = paymentData.vendor_id;

    const activeSubscription = await VendorSubscription.findOne({
        vendor_id: vendorId,
        subscription_status: 'Active',
        isDeleted: false
    });

    let startDate = Date.now();
    if (activeSubscription && activeSubscription.subscription_end_date > startDate) {
        startDate = activeSubscription.subscription_end_date;
    }

    const durationDays = 30;
    const endDate = new Date(new Date(startDate).getTime() + durationDays * 24 * 60 * 60 * 1000);

    paymentData.payment_status = 'Verified';
    paymentData.verified_by = user._id;
    paymentData.verified_at = Date.now();
    paymentData.subscription_status = 'Active';
    paymentData.subscription_start_date = startDate;
    paymentData.subscription_end_date = endDate;
    paymentData.isDeleted = false;

    const newSub = await VendorSubscription.create(paymentData);
    return newSub;
};

exports.getVendorSubscriptionPaymentsCore = async function (user, query) {
    let filter = { ...query };

    if (filter.isDeleted === undefined) {
        filter.isDeleted = false;
    }

    if (user.role === 'admin') {
        // Admins see all
    } else if (user.role === 'vendor') {
        filter.vendor_id = getVendorId(user);
    } else {
        throw new AppError("Rejected permission to view subscriptions", 403);
    }

    const subscriptions = await VendorSubscription.find(filter)
        .populate('vendor_id', 'vendor_name vendor_email')
        .populate('verified_by', 'name');

    return subscriptions;
};

exports.updateVendorSubscriptionPaymentCore = async function (user, paymentId, updateData) {
    if (!checkRole(user.role, ['admin'])) {
        throw new AppError("Only the administration has the authority to modify subscription data", 403);
    }

    delete updateData.vendor_id;
    delete updateData.isDeleted;

    const updatedSub = await VendorSubscription.findByIdAndUpdate(
        paymentId,
        updateData,
        { new: true, runValidators: true }
    );

    if (!updatedSub) throw new AppError("Subscription not found", 404);
    return updatedSub;
};

exports.deleteVendorSubscriptionPaymentCore = async function (user, paymentId) {
    if (!checkRole(user.role, ['admin'])) {
        throw new AppError("Rejected permission to delete subscription", 403);
    }

    const subscription = await VendorSubscription.findById(paymentId);
    if (!subscription) throw new AppError("Subscription not found", 404);

    subscription.isDeleted = true;
    subscription.subscription_status = 'Suspended';

    subscription.payment_metadata = subscription.payment_metadata || {};
    subscription.payment_metadata.deleted_by = user._id;
    subscription.payment_metadata.deleted_at = Date.now();

    await subscription.save();
    return { message: "Deleted subscription successfully" };
};

exports.getCustomerFinancialStatementCore = async function (user, customerPhone) {
    if (!checkRole(user.role, ['vendor'])) {
        throw new AppError("Not authorized to extract customer statement of account", 403);
    }

    const customer = await User.findOne({ mobileNumber: customerPhone, role: 'user' });
    if (!customer) {
        throw new AppError("Customer not found", 404);
    }

    const vendorId = getVendorId(user);
    const customerId = customer._id;

    const paymentsHistory = await BookingPayment.find({
        user_id: customerId,
        vendor_id: vendorId,
        isDeleted: false
    }).sort({ createdAt: -1 });

    const bookingsHistory = await Booking.find({
        user_id: customerId,
        vendor_id: vendorId
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

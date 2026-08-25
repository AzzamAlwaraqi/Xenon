const paymentCore = require("../services/Core/paymentCore");

exports.addBookingPayment = async (req, res, next) => {
    try {
        const payment = await paymentCore.addBookingPaymentCore(req.user, req.body);
        return res.status(201).json({
            status: "success",
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

exports.getBookingPayments = async (req, res, next) => {
    try {
        const payments = await paymentCore.getBookingPaymentsCore(req.user, req.query);
        return res.status(200).json({
            status: "success",
            results: payments.length,
            data: payments
        });
    } catch (error) {
        next(error);
    }
};

exports.updateBookingPayment = async (req, res, next) => {
    try {
        const payment = await paymentCore.updateBookingPaymentCore(req.user, req.params.id, req.body);
        return res.status(200).json({
            status: "success",
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

exports.cancelBookingPayment = async (req, res, next) => {
    try {
        const result = await paymentCore.cancelBookingPaymentCore(req.user, req.params.id);
        return res.status(200).json({
            status: "success",
            ...result
        });
    } catch (error) {
        next(error);
    }
};

exports.addVendorSubscriptionPayment = async (req, res, next) => {
    try {
        const subscription = await paymentCore.addVendorSubscriptionPaymentCore(req.user, req.body);
        return res.status(201).json({
            status: "success",
            data: subscription
        });
    } catch (error) {
        next(error);
    }
};

exports.getVendorSubscriptionPayments = async (req, res, next) => {
    try {
        const subscriptions = await paymentCore.getVendorSubscriptionPaymentsCore(req.user, req.query);
        return res.status(200).json({
            status: "success",
            results: subscriptions.length,
            data: subscriptions
        });
    } catch (error) {
        next(error);
    }
};

exports.updateVendorSubscriptionPayment = async (req, res, next) => {
    try {
        const subscription = await paymentCore.updateVendorSubscriptionPaymentCore(req.user, req.params.id, req.body);
        return res.status(200).json({
            status: "success",
            data: subscription
        });
    } catch (error) {
        next(error);
    }
};

exports.cancelVendorSubscriptionPayment = async (req, res, next) => {
    try {
        const result = await paymentCore.cancelVendorSubscriptionPaymentCore(req.user, req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getCustomerFinancialStatement = async (req, res, next) => {
    try {
        const statement = await paymentCore.getCustomerFinancialStatementCore(req.user, req.params.phone);
        return res.status(200).json({
            status: "success",
            data: statement
        });
    } catch (error) {
        next(error);
    }
};

exports.getVendorFinancialStatement = async (req, res, next) => {
    try {
        const statement = await paymentCore.getVendorFinancialStatementCore(req.user, req.query.vendor_id);
        return res.status(200).json({
            status: "success",
            data: statement
        });
    } catch (error) {
        next(error);
    }
};

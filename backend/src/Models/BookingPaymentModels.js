// models/BookingPayment.js
const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");

const bookingPaymentSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    user_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        required: true,
    },
    vendor_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "Vendor",
        required: true,
    },
    booking_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "Booking",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'JOD', 
    },
    payment_method: {
        type: String,
        enum: ['CliQ', 'Cash', 'ManualBankTransfer', 'OnlineGateway'], 
        required: true,
    },
    payment_status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected', 'Failed', 'Cancelled'], 
        default: 'Pending',
        required: true,
    },
    receipt_image: {
        url: { 
            type: String, 
            required: function() { 
                return this.payment_method === 'CliQ';
            }
        },
        public_id: { 
            type: String, 
            required: function() { 
                return this.payment_method === 'CliQ';
            }
        }
    },
    transaction_id: {
        type: String,
        required: function() { return this.payment_method === 'OnlineGateway'; }
    },
    payment_description: {
        type: String, 
        required: true,
    },
    verified_by: {
        type: mongoose.Schema.Types.UUID,
        ref: "Employee", 
        required: false,
    },
    verified_at: {
        type: Date,
        required: false,
    },
    rejection_reason: {
        type: String,
        required: function() { return this.payment_status === 'Rejected'; }
    },
    // 🌟 حقول الـ Soft Delete
    isDeleted: {
        type: Boolean,
        default: false
    },
    deleted_by: {
        type: mongoose.Schema.Types.UUID,
        ref: 'User',
        default: null
    },
    deleted_at: {
        type: Date,
        default: null
    },
    payment_metadata: {
        type: Object,
        default: {},
    }
}, { timestamps: true });

module.exports = mongoose.model("BookingPayment", bookingPaymentSchema);
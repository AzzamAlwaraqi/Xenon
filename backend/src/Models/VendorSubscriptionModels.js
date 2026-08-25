// models/VendorSubscription.js
const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const softDeletePlugin = require("../utils/softDeletePlugin");

const vendorSubscriptionSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    vendor_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "Vendor",
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
        enum: ['CliQ', 'ManualBankTransfer', 'OnlineGateway'], 
        required: true,
    },
    payment_status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected', 'Failed', 'Cancelled'], 
        default: 'Pending',
        required: true,
    },
    subscription_start_date: {
        type: Date,
        required: false, 
    },
    subscription_end_date: {
        type: Date,
        required: false, 
    },
    subscription_status: {
        type: String,
        enum: ['Active', 'Expired', 'Suspended', 'PendingPayment'],
        default: 'PendingPayment',
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
    verified_by: {
        type: mongoose.Schema.Types.UUID,
        ref: "User", 
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

vendorSubscriptionSchema.plugin(softDeletePlugin);
module.exports = mongoose.model("VendorSubscription", vendorSubscriptionSchema);
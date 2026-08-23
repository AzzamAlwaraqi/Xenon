// models/VendorSubscription.js
const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");

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
        required: true, // قيمة الاشتراك الثابتة
    },
    currency: {
        type: String,
        default: 'JOD',
    },
    payment_method: {
        type: String,
        // الافتراض أن الاشتراكات تُدفع إلكترونياً أو عبر تحويل، لا كاش.
        enum: ['CliQ', 'ManualBankTransfer', 'OnlineGateway'], 
        required: true,
    },
    payment_status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected', 'Failed'],
        default: 'Pending',
        required: true,
    },
    // إدارة فترة الاشتراك (تتحدث عند الموافقة)
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
    // إجباري للتحويلات اليدوية.
    receipt_image_url: {
        type: String,
        required: function() { 
            return ['CliQ', 'ManualBankTransfer'].includes(this.payment_method);
        }
    },
    // إجباري لبوابات الدفع.
    transaction_id: {
        type: String,
        required: function() { return this.payment_method === 'OnlineGateway'; }
    },
    // تفاصيل التحقق (من قِبل الإدارة)
    verified_by: {
        type: mongoose.Schema.Types.UUID,
        ref: "Admin", 
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
    payment_metadata: {
        type: Object, 
        default: {},
    }
}, { timestamps: true });

module.exports = mongoose.model("VendorSubscription", vendorSubscriptionSchema);
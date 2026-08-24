const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const { MongooseStandardDate } = require("../utils/dateFormatter");

const BookingSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    user_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "User"
    },
    vendor_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "Vendor"
    },
    package_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "Package"
    },
    booking_date: {
        type: Date,
        required: true
    },
    number_of_people: {
        type: Number,
        min: [1, "Number of people must be at least 1"],
        max: [5, "Number of people must be at most 5"],
        required: true
    },
    creator_role: {
        type: String,
        enum: ["user", "vendor"],
        required: true
    },
    // 🌟 [جديد]: توثيق الحجز بالنيابة ومصدر الحجز
    booked_by: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        default: null
    },
    booking_source: {
        type: String,
        enum: ['CustomerApp', 'VendorDashboard'],
        default: 'CustomerApp'
    },
    status: {
        type: String,
        required: true,
        enum: ["pending_payment", "pending", "accepted", "rejected", "completed", "cancelled"], // 🌟 إضافة pending_payment
        default: "pending_payment"
    },
    payment_deadline: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 48 * 60 * 60 * 1000);
        }
    },
    total_price: {
        type: Number,
        required: true
    },
    // 🌟 [جديد] توثيق مَن قام بإلغاء الحجز
    cancelled_by: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        default: null
    },
    // 🌟 [جديد] سجل التدقيق (Audit Trail)
    status_history: [{
        status: { type: String },
        changed_by: { type: mongoose.Schema.Types.UUID, ref: "User" },
        changed_at: { type: Date, default: Date.now }
    }],
    isDeleted: { 
        type: Boolean,
        default: false
    },
    deletionRequestedAt: {
        ...MongooseStandardDate,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
});

// Virtuals (تبقى كما هي)
BookingSchema.virtual('booking_time_formatted').get(function() {
    if (!this.createdAt) return null;
    
    const date = new Date(this.createdAt);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
});

BookingSchema.virtual('booking_date_formatted').get(function() {
    if (!this.createdAt) return null;
    
    const date = new Date(this.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
});

module.exports = mongoose.model("Booking", BookingSchema);
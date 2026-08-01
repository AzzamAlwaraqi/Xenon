const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const PackageSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
        unique: true,
        index: true
    },
    vendor_id: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    package_name: {
        type: String,
        required: true
    },
    package_description: {
        type: String,
        required: true
    },
    package_price: {
        type: String,
        required: true
    },
    package_image: {
        type: String,
        required: true
    },
    package_image_id: {
        type: String,
        required: true
    },
    package_type: {
        type: String,
        required: true,
        enum: ['adventure', 'cultural', 'relaxation', 'historical', 'family']
    },
    package_status: {
        type: String,
        required: true,
        enum: ["active", "inactive"],
        default: "active"
    },
    max_people: {
        type: Number,
        required: true,
        default: 175,
        min: [1, "Max people must be at least 1"],
        max: [300, "Max people cannot exceed 300"]
    }, isDelete: {
        type: Boolean,
        default: false
    },
    deletionRequestedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
});
module.exports = mongoose.model("Package", PackageSchema);
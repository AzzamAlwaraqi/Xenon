const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const PackageSchema = new mongoose.Schema({
    _id: {
    type: mongoose.Schema.Types.UUID,
    default: uuidv7 
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
    package_status: {
        type: String,
        required: true,
        enum: ["active", "inactive"],
        default: "active"
    },
    max_people: {
        type: Number,
        min: [1, "Max people must be at least 1"],
        max: [120, "Max people must be at most 120"],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model("Package", PackageSchema);
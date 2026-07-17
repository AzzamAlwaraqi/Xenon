const mongoose = require("mongoose");

const PackageSchema = new mongoose.Schema({
    package_id: {
        type: String,
        required: true
    },
    vendor_id: {
        type: String,
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
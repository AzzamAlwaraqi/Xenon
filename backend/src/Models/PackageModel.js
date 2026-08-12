const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");

const PackageSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    vendor_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "Vendor"
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                return value > this.startDate; 
            },
            message: "the end date must be after the start date"
        }
    },
    package_name: {
        type: String,
        required: true,
        trim: true
    },
    package_description: {
        type: String,
        required: true,
        trim: true
    },
    package_price: {
        type: Number, 
        required: true,
        min: [0, "price cannot be negative"]
    },
    
    images: {
        type: [{
            url: { type: String, required: true },
            public_id: { type: String, required: true }
        }],
        validate: [
            {
                validator: function(val) { return val.length > 0; },
                message: 'you must add one image at least'
            },
            {
                validator: function(val) { return val.length <= 5; },
                message: 'maximum is 5 images'
            }
        ]
    },

    tags: [{
        type: String,
        trim: true
    }], 

    included_services: [{
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true }
    }],

    excluded_services: [{
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true }
    }],

    itinerary: [{
        day_number: { type: Number, required: true, min: 1 },
        title: { type: String, required: true, trim: true },
        activities: { type: String, trim: true }
    }],
    
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
    },
    available_seats: {
        type: Number,
        min: [0, "not seats available"], 
    },
    isDeleted: {
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

PackageSchema.pre('save', function() {
    if (this.isNew && this.available_seats === undefined) {
        this.available_seats = this.max_people;
    }
});

module.exports = mongoose.model("Package", PackageSchema);
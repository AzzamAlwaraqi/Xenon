const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const softDeletePlugin = require("../utils/softDeletePlugin");

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
    package_name: {
        type: String,
        required: true,
        trim: true
    },
    package_description: {
        type: String, // وصف مختصر جداً كإعلان تشويقي للباقة
        required: true,
        trim: true
    },
    package_price: {
        type: Number,
        required: true,
        min: [0, "price cannot be negative"]
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value > this.startDate;
            },
            message: "the end date must be after the start date"
        }
    },
    images: {
        type: [{
            url: { type: String, required: true },
            public_id: { type: String, required: true }
        }],
        validate: [
            {
                validator: function (val) { return val.length >= 1; },
                message: 'you must add one image at least'
            },
            {
                validator: function (val) { return val.length <= 5; },
                message: 'maximum is 5 images'
            }
        ]
    },
    tags: [{
        type: String,
        trim: true
    }],
    package_type: {
        type: String,
        required: [true, "you must specify the type of the package"],
        enum: ['adventure', 'cultural', 'relaxation', 'historical', 'family']
    },
    package_status: {
        type: String,
        required: [true, "you must specify the status of the package"],
        enum: ["active", "inactive"],
        default: "active"
    },
    max_people: {
        type: Number,
        required: [true, "You must specify the maximum number of people for this package"], 
        min: [1, "Max people must be at least 1"], 
        max: [100, "Max people cannot exceed 100 per package to ensure quality and safety"] 
    },
    available_seats: {
        type: Number,
        min: [0, "no seats available"],
    },
    ratingsAverage: {
        type: Number,
        default: 0,
        min: [0, 'Rating must be above 0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val * 10) / 10 
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    deletionRequestedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    strict: 'throw', 
    versionKey: false,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
});

PackageSchema.virtual('details', {
    ref: 'PackageDetails',     
    foreignField: 'package_id', 
    localField: '_id',         
    justOne: true              
});


PackageSchema.pre('save', function () {
    if (this.isNew && this.available_seats === undefined) {
        this.available_seats = this.max_people;
    }
});

PackageSchema.plugin(softDeletePlugin);
module.exports = mongoose.model("Package", PackageSchema);
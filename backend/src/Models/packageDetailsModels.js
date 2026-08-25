const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");

const PackageDetailsSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    package_id: {
        type: mongoose.Schema.Types.UUID,
        required: [true, "Package ID is required to link details"],
        ref: "Package",
        unique: true 
    },


    itinerary: [{
        day_number: { 
            type: Number, 
            required: [true, "Day number is required"], 
            min: [1, "Day number must start from 1"] 
        },
        title: { 
            type: String, 
            required: [true, "Day title is required"], 
            trim: true 
        },
        activities: { 
            type: String, 
            required: [true, "Activities description is required"], 
            trim: true 
        }
    }],


    included_services: [{
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true }
    }],
    excluded_services: [{
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true }
    }],

    
    meeting_point: {
        type: String,
        required: [true, "Meeting point is strictly required for the trip"],
        trim: true
    },
    location_coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    cancellation_policy: {
        type: String,
        default: "Standard cancellation rules apply. Please contact support for more details.",
        trim: true
    },
    important_notes: {
        type: String,
        trim: true,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});



module.exports = mongoose.model("PackageDetails", PackageDetailsSchema);
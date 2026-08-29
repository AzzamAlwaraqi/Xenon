const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const { MongooseStandardDate } = require("../utils/dateFormatter");

const TouristProfileSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    user_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        required: true,
        unique: true
    },
    nationality: {
        type: String,
        trim: true,
        default: null
    },
    emergencyContact: {
        type: String,
        match: [/^([0-9]{3}|[0-9]{10})$/, 'Emergency phone number must be 3 or 10 digits'],
        default: "911"
    },
    preferredDestinations: [{
        destination: { type: String, trim: true, required: true },
        visits: { type: Number, default: 1 }
    }]
}, { 
    timestamps: true,
    strict: 'throw', 
    versionKey: false 
});
TouristProfileSchema.methods.addPreferredDestination = async function (destinationName) {
    try {
        const existingDest = this.preferredDestinations.find(
            d => d.destination.toLowerCase() === destinationName.toLowerCase()
        );

        if (existingDest) {
            existingDest.visits += 1;
        } else {
            this.preferredDestinations.push({ destination: destinationName, visits: 1 });
        }
        
        // Sort by visits descending
        this.preferredDestinations.sort((a, b) => b.visits - a.visits);

        await this.save();
    } catch (error) {
        console.error('Error adding preferred destination:', error);
    }
};

module.exports = mongoose.model("Tourist", TouristProfileSchema);
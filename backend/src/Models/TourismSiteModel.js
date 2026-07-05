const mongoose = require("mongoose");

const TourismSiteSchema = new mongoose.Schema({
    site_id: {
        type: String,
        required: true
    },
    site_name: {
        type: String,
        required: true
    },
    site_description: {
        type: String,
        required: true
    },
    site_image: {
        type: String,
        required: true
    },
    site_status: {
        type: String,
        required: true,
        enum: ["active", "inactive"],
        default: "active"
    },
    site_type: {
        type: String,
        required: true,
        enum: ["natural", "historical", "religious", "other"],
        default: "natural"
    },
    site_category: {
        type: String,
        required: true,
        enum: ["national_park", "historical_monument", "religious_site", "other"],
        default: "natural"
    },
    site_subcategory: {
        type: String,
        required: true,
        enum: ["national_park", "historical_monument", "religious_site", "other"],
        default: "national_park"
    },
    site_location: {
        type: String,
        required: true
    },
    site_coordinates: {
        type: String,
        required: true
    },
    site_distance_from_city: {
        type: String,
        required: true
    },
    site_time_to_reach: {
        type: String,
        required: true
    },
    site_best_time_to_visit: {
        type: String,
        required: true
    },
    site_rating: {
        type: Number,
        required: true
    },
    site_reviews: {
        type: Array,
        required: true
    },
    site_videos: {
        type: Array,
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
module.exports = mongoose.model("TourismSite", TourismSiteSchema);
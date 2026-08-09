const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const { MongooseStandardDate } = require("../utils/dateFormatter");
const { countDocuments } = require("./VendorModel");
const ReviewSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    user_id: {
        type: String,
        required: true
    },
    review_text: {
        type: String,
        required: true
    },
    review_rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 4.3,
        validate: {
            validator: function(v) {
                return v >= 1 && v <= 5;
            },
            message: "Review rating must be between 1 and 5"
        }
    },
    sum_rating:{
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 1,
        validate: {
            validator: function(v) {
                return v >= 1 && v <= 5;

            },
            message: "Average rating must be between 1 and 5"
        }
    },
    AVG_RATING:{
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 1,
        validate: {
            validator: function(v) {
                return v >= 1 && v <= 5 && v == this.sum_rating/countDocuments({_id:this._id}) ;

            },
            message: "Average rating must be between 1 and 5"
        }
    },
    review_date: {
        ...MongooseStandardDate,
        required: true,
        default: Date.now()
    },
    review_time: {
        type: String,
        required: true,
        default: function() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    },
    vendor_id: {
        type: String,
        required: true
    },
    package_id: {
        type: String,
        required: true
    },
    package_name: {
        type: String,
        required: true
    },
    review_status: {
        type: String,
        required: true,
        enum: ["accepted", "rejected","in-progress"],
        default: "in-progress"
    }
}, {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
});
module.exports = mongoose.model("Review", ReviewSchema);
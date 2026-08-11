const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");

const ReviewSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    user_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "user"
    },
    vendor_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "vendor"
    },
    package_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "package"
    },
    review_text: {
        type: String,
        required: true,
        trim: true
    },
    review_rating: {
        type: Number,
        required: true,
        min: [1, "التقييم يجب أن يكون 1 كحد أدنى"],
        max: [5, "التقييم يجب أن يكون 5 كحد أقصى"]
    },
    review_status: {
        type: String,
        required: true,
        enum: ["accepted", "rejected", "in-progress"],
        default: "in-progress"
    }
}, {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
});

ReviewSchema.virtual('review_time_formatted').get(function() {
    if (!this.createdAt) return null;
    const date = new Date(this.createdAt);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
});

ReviewSchema.virtual('review_date_formatted').get(function() {
    if (!this.createdAt) return null;
    const date = new Date(this.createdAt);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
});

ReviewSchema.statics.calcAverageRatings = async function(packageId) {
    const stats = await this.aggregate([
        {
            $match: { package_id: packageId, review_status: "accepted" }
        },
        {
            $group: {
                _id: '$package_id',
                nRating: { $sum: 1 }, 
                avgRating: { $avg: '$review_rating' } 
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('Package').findByIdAndUpdate(packageId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: Math.round(stats[0].avgRating * 10) / 10 
        });
    } else {
        await mongoose.model('Package').findByIdAndUpdate(packageId, {
            ratingsQuantity: 0,
            ratingsAverage: 0
        });
    }
};

ReviewSchema.post('save', function() {
    this.constructor.calcAverageRatings(this.package_id);
});

ReviewSchema.post(/^findOneAnd/, async function(doc) {
    if (doc) {
        await doc.constructor.calcAverageRatings(doc.package_id);
    }
});

module.exports = mongoose.model("Review", ReviewSchema);
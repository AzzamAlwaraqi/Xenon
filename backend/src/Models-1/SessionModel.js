const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    token_id: { 
        type: String,
        required: true,
        unique: true
    },
    expires_at: {
        type: Date,
        required: true,
        index: { expires: 0 } 
    },
    ip_address: { 
        type: String,
        required: true
    },
    user_agent: { 
        type: String,
        required: true
     },
    device_type: { 
        type: String,
        required: true 
    },
    os_name: {
        type: String,
        required: true
         },
    browser_name: {
         type: String,
          required: true
        },
    device_id: {
         type: String,
          required: true
        },
    is_active: { 
        type: Boolean,
        required: true,
        default: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model("Session", SessionSchema);
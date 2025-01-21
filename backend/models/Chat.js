const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    challengeId: {
        type: String,
        required: true
    },
    senderId: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying
chatMessageSchema.index({ challengeId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema); 
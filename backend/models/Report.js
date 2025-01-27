const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: String,
    required: true
  },
  reportedUserId: {
    type: String,
    required: true
  },
  challengeId: {
    type: String,
    // Optional since reports can be on users or challenges
  },
  reason: {
    type: String,
    required: true,
    default: 'Flagged for review'
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema); 
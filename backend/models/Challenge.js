const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  exerciseType: {
    type: String,
    required: true,
    enum: ['pushups', 'squats', 'situps', 'pullups']
  },
  exerciseCount: {
    type: Number,
    required: true,
    min: 1
  },
  firstRaiseTime: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: function(v) {
        return v <= Math.floor(this.duration / 2);
      },
      message: 'First raise time must be less than or equal to half of the challenge duration'
    }
  },
  originalBet: { 
    type: Number, 
    required: true,
    min: 0
  },
  duration: { 
    type: Number, 
    required: true,
    min: 1
  },
  durationUnit: { 
    type: String, 
    required: true,
    enum: ['days', 'weeks']
  },
  createdBy: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  participants: [{
    userId: String,
    joinedAt: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'failed'],
      default: 'active'
    }
  }]
}, {
  timestamps: true
});

// Index for efficient querying
challengeSchema.index({ status: 1, createdAt: -1 });
challengeSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Challenge', challengeSchema); 
const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  age: { 
    type: Number, 
    required: true 
  },
  fitnessExperience: { 
    type: String, 
    required: true 
  },
  profilePicture: { 
    type: String,
    default: null
  },
  showcasePicture1: { 
    type: String,
    default: null
  },
  showcasePicture2: { 
    type: String,
    default: null
  },
  verificationIdPicture: {
    type: String,
    default: null
  },
  verificationFrontalPicture: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Profile', ProfileSchema); 
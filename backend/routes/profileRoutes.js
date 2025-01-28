const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const Profile = require('../models/Profile');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/profiles');
    console.log('Upload path:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// Define Profile Schema
const ProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  fitnessExperience: { type: String, required: true },
  profilePicture: { type: String },
  showcasePicture1: { type: String },
  showcasePicture2: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

let ProfileModel;
try {
  ProfileModel = mongoose.model('Profile');
} catch {
  ProfileModel = mongoose.model('Profile', ProfileSchema);
}

// Get user profile
router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /api/profile - Fetching profile for user:', req.user.id);
    const profile = await ProfileModel.findOne({ userId: req.user.id });
    
    if (!profile) {
      console.log('No profile found for user:', req.user.id);
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    console.log('Profile found:', profile);
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update profile
router.post('/', auth, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'showcasePicture1', maxCount: 1 },
  { name: 'showcasePicture2', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('POST /api/profile - Updating profile for user:', req.user.id);
    console.log('Request body:', req.body);
    console.log('Files:', req.files);

    if (!req.user || !req.user.id) {
      throw new Error('User not authenticated properly');
    }

    const { name, age, fitnessExperience } = req.body;

    // Validate required fields
    if (!name || !age || !fitnessExperience) {
      console.log('Missing required fields:', { name, age, fitnessExperience });
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: { name, age, fitnessExperience }
      });
    }

    const profileData = {
      userId: req.user.id,
      name,
      age: parseInt(age),
      fitnessExperience,
      updatedAt: new Date()
    };

    // Handle pictures
    if (req.files) {
      if (req.files.profilePicture) {
        profileData.profilePicture = `/uploads/profiles/${req.files.profilePicture[0].filename}`;
      }
      if (req.files.showcasePicture1) {
        profileData.showcasePicture1 = `/uploads/profiles/${req.files.showcasePicture1[0].filename}`;
      }
      if (req.files.showcasePicture2) {
        profileData.showcasePicture2 = `/uploads/profiles/${req.files.showcasePicture2[0].filename}`;
      }
    }

    console.log('Profile data to save:', profileData);

    const profile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      profileData,
      { new: true, upsert: true, runValidators: true }
    );

    console.log('Profile saved successfully:', profile);
    res.json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 
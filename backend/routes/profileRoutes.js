const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ProfileModel = require('../models/Profile');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'profiles');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(ext);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg, .jpeg and .gif format allowed!'));
  }
}).fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'showcasePicture1', maxCount: 1 },
  { name: 'showcasePicture2', maxCount: 1 }
]);

// Middleware to handle multer errors
const handleUpload = (req, res, next) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    } else if (err) {
      return res.status(400).json({
        message: 'Invalid file type',
        error: err.message
      });
    }
    next();
  });
};

// Get current user's profile
router.get('/', auth, async (req, res) => {
  try {
    const profile = await ProfileModel.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get profile by user ID
router.get('/:userId/profile', auth, async (req, res) => {
  try {
    const profile = await ProfileModel.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update profile with pictures
router.post('/', auth, handleUpload, async (req, res) => {
  try {
    console.log('Updating profile for user:', req.user.id);
    console.log('Request body:', req.body);
    console.log('Files:', req.files);

    const { name, age, fitnessExperience, bio, description } = req.body;

    // Validate required fields
    if (!name || !age || !fitnessExperience) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['name', 'age', 'fitnessExperience']
      });
    }

    // Find existing profile
    let existingProfile = await ProfileModel.findOne({ userId: req.user.id });

    // Prepare profile data
    let profileData = {
      userId: req.user.id,
      name,
      age: parseInt(age),
      fitnessExperience,
      bio: bio || '',
      description: description || '',
      updatedAt: new Date()
    };

    // Handle picture updates
    if (req.files) {
      // Delete old files if new ones are uploaded
      const handlePictureUpdate = async (fieldName) => {
        if (req.files[fieldName]) {
          // Delete old file if it exists
          if (existingProfile && existingProfile[fieldName]) {
            const oldPath = path.join(__dirname, '..', existingProfile[fieldName]);
            try {
              if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
              }
            } catch (error) {
              console.error(`Error deleting old ${fieldName}:`, error);
            }
          }
          // Set new file path
          profileData[fieldName] = `/uploads/profiles/${req.files[fieldName][0].filename}`;
        } else if (existingProfile) {
          profileData[fieldName] = existingProfile[fieldName];
        }
      };

      await handlePictureUpdate('profilePicture');
      await handlePictureUpdate('showcasePicture1');
      await handlePictureUpdate('showcasePicture2');
    } else if (existingProfile) {
      // Keep existing pictures if no new ones are uploaded
      profileData.profilePicture = existingProfile.profilePicture;
      profileData.showcasePicture1 = existingProfile.showcasePicture1;
      profileData.showcasePicture2 = existingProfile.showcasePicture2;
    }

    // Update or create profile
    const profile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      profileData,
      { new: true, upsert: true, runValidators: true }
    );

    console.log('Profile saved successfully:', profile);
    res.json({ 
      message: 'Profile updated successfully', 
      profile,
      updatedFields: Object.keys(profileData)
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate key error', 
        error: 'A profile with this information already exists'
      });
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all profiles (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    console.log('User role:', req.user.role);
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const profiles = await ProfileModel.find()
      .select('name email age fitnessExperience profilePicture createdAt')
      .sort({ createdAt: -1 });
    
    console.log('Fetched profiles:', profiles.length);
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching all profiles:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 
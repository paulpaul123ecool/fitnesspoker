const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define Profile Schema if not already defined
const ProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  fitnessExperience: { type: String, required: true },
  profilePicture: { type: String },
  updatedAt: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false }
});

let Profile;
try {
  Profile = mongoose.model('Profile');
} catch {
  Profile = mongoose.model('Profile', ProfileSchema);
}

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'verifications');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    // Format: verification-[challengeId]-[timestamp]-[userId]-[originalname]
    cb(null, `verification-${req.params.challengeId}-${timestamp}-${req.user.id}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|mov|avi|wmv/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only video files are allowed!'));
  }
});

// Get all challenges (must be defined before other routes)
router.get('/all', auth, async (req, res) => {
  try {
    console.log('Fetching all challenges');
    console.log('Current user ID:', req.user.id);
    
    // Find challenges that:
    // 1. Are not cancelled
    // 2. Have no participants (not yet accepted)
    const challenges = await Challenge.find({
      status: { $ne: 'cancelled' },
      participants: { $size: 0 }  // Only show challenges with no participants
    }).sort({ createdAt: -1 });
    
    // Get all unique creator IDs
    const creatorIds = [...new Set(challenges.map(c => c.createdBy))];
    console.log('Creator IDs:', creatorIds);
    
    // Fetch all profiles for creators in one query
    const profiles = await Profile.find({ userId: { $in: creatorIds } });
    
    // Create a map of userId to profile info for quick lookup
    const profileMap = profiles.reduce((map, profile) => {
      map[profile.userId] = {
        name: profile.name || 'Unknown User',
        profilePicture: profile.profilePicture ? `http://localhost:5000${profile.profilePicture}` : null,
        isVerified: profile.isVerified || false
      };
      return map;
    }, {});
    
    // Add user information to each challenge
    const enhancedChallenges = challenges.map(challenge => {
      const creatorProfile = profileMap[challenge.createdBy] || { 
        name: 'Unknown User', 
        profilePicture: null,
        isVerified: false
      };
      const isCreator = String(challenge.createdBy) === String(req.user.id);
      
      return {
        ...challenge.toObject(),
        isCreator,
        creatorName: creatorProfile.name,
        creatorProfilePicture: creatorProfile.profilePicture,
        creatorIsVerified: creatorProfile.isVerified
      };
    });
    
    res.json(enhancedChallenges);
  } catch (error) {
    console.error('Error fetching all challenges:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept a challenge
router.post('/:id/accept', auth, async (req, res) => {
  try {
    console.log('Accepting challenge:', req.params.id);
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Check if user is not the creator
    if (String(challenge.createdBy) === String(req.user.id)) {
      return res.status(400).json({ message: 'Cannot accept your own challenge' });
    }
    
    // Check if user hasn't already accepted
    if (challenge.participants.some(p => p.userId === req.user.id)) {
      return res.status(400).json({ message: 'Already accepted this challenge' });
    }
    
    challenge.participants.push({
      userId: req.user.id,
      joinedAt: new Date(),
      status: 'active'
    });
    
    await challenge.save();
    console.log('Challenge accepted successfully');
    res.json(challenge);
  } catch (error) {
    console.error('Error accepting challenge:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's challenges
router.get('/', auth, async (req, res) => {
  try {
    const challenges = await Challenge.find({
      $or: [
        { createdBy: req.user.id },
        { 'participants.userId': req.user.id }
      ]
    }).sort({ createdAt: -1 });

    // Get all unique creator IDs
    const creatorIds = [...new Set(challenges.map(c => c.createdBy))];
    
    // Fetch all profiles for creators in one query
    const profiles = await Profile.find({ userId: { $in: creatorIds } });
    
    // Create a map of userId to profile info for quick lookup
    const profileMap = profiles.reduce((map, profile) => {
      map[profile.userId] = {
        name: profile.name || 'Unknown User',
        profilePicture: profile.profilePicture ? `http://localhost:5000${profile.profilePicture}` : null
      };
      return map;
    }, {});

    // Add creator information to each challenge
    const enhancedChallenges = challenges.map(challenge => {
      const isCreator = String(challenge.createdBy) === String(req.user.id);
      const creatorProfile = profileMap[challenge.createdBy] || { name: 'Unknown User', profilePicture: null };
      
      return {
        ...challenge.toObject(),
        isCreator,
        creatorName: creatorProfile.name,
        creatorProfilePicture: creatorProfile.profilePicture
      };
    });
    
    res.json(enhancedChallenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new challenge
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new challenge:', req.body);
    const challenge = new Challenge({
      ...req.body,
      createdBy: req.user.id
    });
    await challenge.save();
    res.status(201).json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific challenge
router.get('/:id', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update challenge status
router.put('/:id', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    if (String(challenge.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to update this challenge' });
    }
    
    Object.assign(challenge, req.body);
    await challenge.save();
    res.json(challenge);
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a specific challenge (by creator or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Allow both the creator and admin to delete
    const isCreator = String(challenge.createdBy) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this challenge' });
    }
    
    await challenge.deleteOne();
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join a challenge
router.post('/:id/join', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    if (challenge.participants.some(p => p.userId === req.user.id)) {
      return res.status(400).json({ message: 'Already participating in this challenge' });
    }
    
    challenge.participants.push({
      userId: req.user.id,
      joinedAt: new Date(),
      status: 'active'
    });
    
    await challenge.save();
    res.json(challenge);
  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leave a challenge
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    const participantIndex = challenge.participants.findIndex(p => p.userId === req.user.id);
    if (participantIndex === -1) {
      return res.status(400).json({ message: 'Not participating in this challenge' });
    }
    
    challenge.participants.splice(participantIndex, 1);
    await challenge.save();
    res.json(challenge);
  } catch (error) {
    console.error('Error leaving challenge:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all ongoing challenges for admin
router.get('/admin/ongoing', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Find all active challenges
    const challenges = await Challenge.find({
      status: 'active'
    }).sort({ createdAt: -1 });
    
    // Get all unique user IDs (creators and participants)
    const userIds = new Set();
    challenges.forEach(challenge => {
      userIds.add(challenge.createdBy);
      challenge.participants.forEach(participant => userIds.add(participant.userId));
    });
    
    // Fetch all profiles in one query
    const profiles = await Profile.find({ userId: { $in: [...userIds] } });
    const profileMap = profiles.reduce((map, profile) => {
      map[profile.userId] = {
        name: profile.name || 'Unknown User',
        profilePicture: profile.profilePicture ? `http://localhost:5000${profile.profilePicture}` : null
      };
      return map;
    }, {});
    
    // Add user information to each challenge
    const enhancedChallenges = challenges.map(challenge => {
      const creatorProfile = profileMap[challenge.createdBy];
      const enhancedParticipants = challenge.participants.map(participant => ({
        ...participant.toObject(),
        profile: profileMap[participant.userId] || { name: 'Unknown User', profilePicture: null }
      }));
      
      return {
        ...challenge.toObject(),
        creatorName: creatorProfile ? creatorProfile.name : 'Unknown User',
        creatorProfilePicture: creatorProfile ? creatorProfile.profilePicture : null,
        participants: enhancedParticipants
      };
    });
    
    res.json(enhancedChallenges);
  } catch (error) {
    console.error('Error fetching admin ongoing challenges:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload daily verification video
router.post('/:challengeId/verify-daily', auth, upload.single('video'), async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if user is part of the challenge
    const isCreator = String(challenge.createdBy) === String(req.user.id);
    const isParticipant = challenge.participants.some(p => String(p.userId) === String(req.user.id));

    if (!isCreator && !isParticipant) {
      return res.status(403).json({ message: 'Not authorized to submit verification for this challenge' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    // Add verification record to challenge
    const verificationEntry = {
      userId: req.user.id,
      videoUrl: `/uploads/verifications/${req.file.filename}`,
      timestamp: new Date()
    };

    if (!challenge.verifications) {
      challenge.verifications = [];
    }

    challenge.verifications.push(verificationEntry);
    await challenge.save();

    res.json({ 
      message: 'Verification video uploaded successfully',
      verification: verificationEntry
    });

  } catch (error) {
    console.error('Error uploading verification video:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 
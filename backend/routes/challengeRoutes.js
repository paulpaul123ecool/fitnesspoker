const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');

// Define Profile Schema if not already defined
const ProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  fitnessExperience: { type: String, required: true },
  profilePicture: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

let Profile;
try {
  Profile = mongoose.model('Profile');
} catch {
  Profile = mongoose.model('Profile', ProfileSchema);
}

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
        profilePicture: profile.profilePicture ? `http://localhost:5000${profile.profilePicture}` : null
      };
      return map;
    }, {});
    
    // Add user information to each challenge
    const enhancedChallenges = challenges.map(challenge => {
      const creatorProfile = profileMap[challenge.createdBy] || { name: 'Unknown User', profilePicture: null };
      const isCreator = String(challenge.createdBy) === String(req.user.id);
      
      return {
        ...challenge.toObject(),
        isCreator,
        creatorName: creatorProfile.name,
        creatorProfilePicture: creatorProfile.profilePicture
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

// Delete a specific challenge (only by creator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    if (String(challenge.createdBy) !== String(req.user.id)) {
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

module.exports = router; 
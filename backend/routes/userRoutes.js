const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

// Get all users (excluding sensitive information)
router.get('/users', auth, async (req, res) => {
  try {
    // Get all users except the current user
    const users = await User.find(
      { _id: { $ne: req.user.id } },
      '_id email'
    );

    // Get profiles for all users
    const profiles = await Profile.find({
      userId: { $in: users.map(user => user._id.toString()) }
    });

    // Create a map of user IDs to their profiles
    const profileMap = new Map(
      profiles.map(profile => [profile.userId, profile])
    );

    // Combine user and profile data
    const usersWithProfiles = users.map(user => {
      const userProfile = profileMap.get(user._id.toString());
      return {
        _id: user._id,
        email: user.email,
        profile: userProfile ? {
          name: userProfile.name,
          profilePicture: userProfile.profilePicture
        } : null
      };
    });

    // Only return users who have profiles with names
    const usersWithNames = usersWithProfiles.filter(user => 
      user.profile && user.profile.name
    );

    res.json(usersWithNames);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const auth = require('../middleware/auth');

// Create a new report
router.post('/', auth, async (req, res) => {
  try {
    const { reportedUserId, challengeId, reason } = req.body;
    const reporterId = req.user.userId;

    console.log('Creating report with data:', {
      reporterId,
      reportedUserId,
      challengeId,
      reason
    });

    if (!reportedUserId) {
      return res.status(400).json({ message: 'Reported user ID is required' });
    }

    const report = new Report({
      reporterId,
      reportedUserId,
      challengeId,
      reason: reason || 'Flagged for review'
    });

    await report.save();
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ 
      message: 'Error submitting report',
      error: error.message 
    });
  }
});

// Get all reports (admin only)
router.get('/', auth, async (req, res) => {
  try {
    // TODO: Add admin check middleware
    const reports = await Report.find()
      .sort({ createdAt: -1 }) // Most recent first
      .populate('reporterId', 'name profilePicture')
      .populate('reportedUserId', 'name profilePicture');
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ 
      message: 'Error fetching reports',
      error: error.message 
    });
  }
});

module.exports = router; 
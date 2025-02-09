const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

// Create a new report
router.post('/', auth, async (req, res) => {
  try {
    const { reportedUserId, challengeId, videoUrl, reason } = req.body;
    
    const report = new Report({
      reporterId: req.user.id,
      reportedUserId,
      challengeId,
      videoUrl,
      reason,
      status: 'pending'
    });

    await report.save();
    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Failed to create report' });
  }
});

// Get all reports (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const reports = await Report.find()
      .populate('challengeId', 'name description')
      .sort({ createdAt: -1 });

    // Get all unique user IDs from reports
    const userIds = [...new Set([
      ...reports.map(report => report.reporterId.toString()),
      ...reports.map(report => report.reportedUserId.toString())
    ])];

    // Fetch all profiles for these users in one query
    const profiles = await Profile.find({
      userId: { $in: userIds }
    });

    // Create a map of userId to profile name
    const userProfileMap = new Map(
      profiles.map(profile => [profile.userId, profile.name])
    );

    // Transform the reports with user names
    const transformedReports = reports.map(report => {
      const reportObj = report.toObject();
      return {
        ...reportObj,
        reporterId: {
          _id: reportObj.reporterId,
          name: userProfileMap.get(reportObj.reporterId.toString()) || 'Unknown User'
        },
        reportedUserId: {
          _id: reportObj.reportedUserId,
          name: userProfileMap.get(reportObj.reportedUserId.toString()) || 'Unknown User'
        }
      };
    });

    res.json(transformedReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// Update report status (admin only)
router.put('/:reportId/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ message: 'Failed to update report status' });
  }
});

module.exports = router; 
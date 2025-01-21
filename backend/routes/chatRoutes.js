const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/Chat');
const auth = require('../middleware/auth');

// Get chat messages for a challenge
router.get('/:challengeId', auth, async (req, res) => {
    try {
        const messages = await ChatMessage.find({ challengeId: req.params.challengeId })
            .sort({ timestamp: 1 })
            .populate('senderId', 'name profilePicture');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

// Send a new message
router.post('/:challengeId', auth, async (req, res) => {
    try {
        const newMessage = new ChatMessage({
            challengeId: req.params.challengeId,
            senderId: req.user.id,
            message: req.body.message
        });
        await newMessage.save();
        
        const populatedMessage = await ChatMessage.findById(newMessage._id)
            .populate('senderId', 'name profilePicture');
        
        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message' });
    }
});

module.exports = router; 
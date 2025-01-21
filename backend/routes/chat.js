const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/Chat');
const auth = require('../middleware/auth');

// Get chat messages for a challenge
router.get('/:challengeId', auth, async (req, res) => {
    try {
        console.log('Fetching messages for challenge:', req.params.challengeId);
        const messages = await ChatMessage.find({ challengeId: req.params.challengeId })
            .sort({ timestamp: 1 });
        console.log('Found messages:', messages);
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
});

// Send a new message
router.post('/:challengeId', auth, async (req, res) => {
    try {
        console.log('Creating new message:', {
            challengeId: req.params.challengeId,
            senderId: req.user.id,
            message: req.body.message
        });
        
        const newMessage = new ChatMessage({
            challengeId: req.params.challengeId,
            senderId: req.user.id,
            message: req.body.message
        });
        
        await newMessage.save();
        console.log('Message saved:', newMessage);
        
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
});

module.exports = router; 
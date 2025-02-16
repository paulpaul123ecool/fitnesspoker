const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

// Get chat messages between current user and another user
router.get('/:userId/messages', auth, async (req, res) => {
  try {
    const messages = await Chat.find({
      $or: [
        { senderId: req.user.id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user.id }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a new message
router.post('/:userId/messages', auth, async (req, res) => {
  try {
    const messageData = {
      senderId: req.user.id,
      receiverId: req.params.userId,
      content: req.body.content,
      timestamp: new Date()
    };

    // If this is a verification message, add the verification data
    if (req.body.content.startsWith('[Daily Verification Video Uploaded for Challenge:') && req.body.verification) {
      messageData.verification = {
        videoUrl: req.body.verification.videoUrl,
        timestamp: new Date()
      };
    }

    const newMessage = new Chat(messageData);
    await newMessage.save();

    // Emit the message through Socket.IO
    const io = req.app.get('io');
    io.to(req.params.userId).emit('newMessage', newMessage);

    res.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
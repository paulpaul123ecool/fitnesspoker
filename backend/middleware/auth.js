const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Make sure we include all necessary user information
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role // Explicitly include the role
    };
    
    console.log('Authenticated user:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });

    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

module.exports = auth; 
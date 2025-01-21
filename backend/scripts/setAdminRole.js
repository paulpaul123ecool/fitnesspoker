const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function setAdminRole() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adminEmail = 'admin@fitnesspoker.com';
    const user = await User.findOne({ email: adminEmail });
    
    if (user) {
      user.role = 'admin';
      await user.save();
      console.log('Admin role set successfully');
    } else {
      console.log('Admin user not found');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

setAdminRole(); 
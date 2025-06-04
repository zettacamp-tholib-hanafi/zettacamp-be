// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// Connect to MongoDB using mongoose with proper error handling for reliability
const ConnectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/zettacamp-be-tholib');
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    
    // Exit the process if connection fails to avoid undefined behavior
    process.exit(1);
  }
};

// *************** EXPORT MODULE ***************
module.exports = ConnectDB;

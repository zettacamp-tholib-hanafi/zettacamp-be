// *************** IMPORT CORE ***************
const mongoose = require("mongoose");
require('dotenv').config();

const DB_URL = process.env.DB_URL;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;
// *************** Connect to MongoDB using mongoose with proper error handling for reliability
async function ConnectDB() {
  try {
    await mongoose.connect(`mongodb://${DB_URL}:${DB_PORT}/${DB_NAME}`);
    // await mongoose.connect(`mongodb://localhost:27017/zettacamp-be-tholib-v1`);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);

    // *************** Exit the process if connection fails to avoid undefined behavior
    process.exit(1);
  }
}

// *************** EXPORT MODULE ***************
module.exports = ConnectDB;

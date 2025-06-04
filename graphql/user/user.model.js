// *************** IMPORT LIBRARY ***************
const { Schema, model } = require('mongoose');

// *************** MUTATION ***************
// Define the User schema representing user data in the system
const userSchema = new Schema(
  {
    // First name of the user
    first_name: {
      type: String,
      required: true,
      trim: true,
    },

    // Last name of the user
    last_name: {
      type: String,
      required: true,
      trim: true,
    },

    // Unique email address of the user
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Hashed password used for authentication
    password: {
      type: String,
      required: true,
    },

    // Role of the user (e.g., admin, member)
    role: {
      type: String,
      required: true,
    },

    // Marks soft deletion timestamp (null if not deleted)
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// *************** EXPORT MODULE ***************
module.exports = model('User', userSchema);
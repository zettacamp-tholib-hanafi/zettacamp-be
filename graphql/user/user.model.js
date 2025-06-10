// *************** IMPORT LIBRARY ***************
const { Schema, model } = require("mongoose");

// *************** CONSTANTS
const ROLE_ENUM = ["ACADEMIC_DIRECTOR", "ACADEMIC_ADMIN", "CORRECTOR"];
const STATUS_ENUM = ["ACTIVE", "PENDING", "DELETED"];
const DEPARTMENT_ENUM = ["academic", "admissions"];

// *************** Define the User schema representing user data in the system
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

    // Hashed password for authentication
    password: {
      type: String,
      required: true,
    },

    // Role(s) assigned to the user
    role: {
      type: [String],
      enum: ROLE_ENUM,
      required: true,
    },

    // Current status of the user account
    user_status: {
      type: String,
      enum: STATUS_ENUM,
      required: true,
    },

    // Contact phone number
    phone: {
      type: String,
    },

    // URL to the user's profile picture
    profile_picture_url: {
      type: String,
    },

    // Department the user belongs to
    department: {
      type: String,
      enum: DEPARTMENT_ENUM,
    },

    // List of permissions
    permissions: {
      type: [String],
    },

    // User preferences (language, timezone)
    preferences: {
      language: {
        type: String,
        default: "en",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },

    // ID of the user who created this record
    created_by: {
      type: String,
    },

    // ID of the user who last updated this record
    updated_by: {
      type: String,
    },

    // Timestamp when user was soft-deleted
    deleted_at: {
      type: Date,
      default: null,
    },

    // ID of the user who deleted this record
    deleted_by: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// *************** EXPORT MODULE ***************
module.exports = model("User", userSchema);

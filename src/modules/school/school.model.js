// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require("mongoose");

// *************** Constant Enum
const VALID_STATUS = ["ACTIVE", "PENDING", "DELETED"];
const DEFALUT_VALID_STATUS = "PENDING";

const schoolSchema = new Schema(
  {
    // Short Name of the school
    short_name: {
      type: String,
      required: true,
      trim: true,
    },

    // Long Name of the school
    long_name: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional Logo URL
    logo_url: {
      type: String,
      default: null,
      trim: true,
    },

    // Verification information (array with at least one object)
    verified: [
      {
        status_verified: {
          type: Boolean,
          default: false,
        },
        verified_by: {
          type: String,
          default: null,
          trim: true,
        },
        verified_at: {
          type: Date,
          default: null,
        },
      },
    ],

    // Structured address
    address: {
      street_name: { type: String, required: true, trim: true },
      street_number: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postal_code: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
      address_line1: { type: String, required: true, trim: true },
      address_line2: { type: String, default: null, trim: true },
    },

    // Optional contact information
    contact: {
      phone: { type: String, default: null, trim: true },
      email: { type: String, default: null, trim: true },
      website: { type: String, default: null, trim: true },
    },

    // Optional admin users
    admin_user: [
      {
        id: { type: String, default: null, trim: true },
        role: { type: String, default: null, trim: true },
        assigned_at: { type: String, default: null },
      },
    ],

    // School status: PENDING, ACTIVE, DELETED
    school_status: {
      type: String,
      enum: VALID_STATUS,
      default: DEFALUT_VALID_STATUS,
      required: true,
      trim: true,
    },

    // Array of Student ID (optional)
    students: [
      {
        type: Types.ObjectId,
        ref: "Student",
      },
    ],

    // Soft delete fields
    deleted_at: {
      type: Date,
      default: null,
    },
    deleted_by: {
      type: String,
      default: null,
      trim: true,
    },

    // Audit trail
    created_by: {
      type: String,
      trim: true,
    },
    updated_by: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// *************** EXPORT MODULE ***************
module.exports = model("School", schoolSchema);

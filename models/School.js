// *************** IMPORT LIBRARY ***************
const { Schema, model } = require('mongoose');

// *************** MUTATION ***************
// Defines the School schema representing school data in the system
const schoolSchema = new Schema(
  {
    // Name of the school
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Physical or mailing address of the school (optional)
    address: {
      type: String,
      default: null,
      trim: true,
    },

    // Marks soft deletion timestamp (null if not deleted)
    deletedAt: {
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
module.exports = model('School', schoolSchema);
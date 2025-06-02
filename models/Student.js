// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require('mongoose');

// *************** MUTATION ***************
// Defines the Student schema representing student data in the system
const StudentSchema = new Schema(
  {
    // First name of the student
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    // Last name of the student
    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    // Unique email address of the student
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Reference to the associated school
    schoolId: {
      type: Types.ObjectId,
      ref: 'School',
      required: true,
    },

    // Student's date of birth (optional)
    dateOfBirth: {
      type: Date,
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
module.exports = model('Student', StudentSchema);

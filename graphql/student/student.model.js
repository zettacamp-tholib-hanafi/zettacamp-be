// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require("mongoose");

// *************** Defines the Student schema representing student data in the system
const StudentSchema = new Schema(
  {
    // First name of the student
    first_name: {
      type: String,
      required: true,
      trim: true,
    },

    // Last name of the student
    last_name: {
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
    school_id: {
      type: Types.ObjectId,
      ref: "School",
      required: true,
    },

    // Student's date of birth (optional)
    date_of_birth: {
      type: Date,
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
module.exports = model("Student", StudentSchema);

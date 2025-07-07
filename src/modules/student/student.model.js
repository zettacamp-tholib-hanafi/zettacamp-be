// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require("mongoose");

// ************** IMPORT UTILITIES *************
const { STUDENT } = require("../../shared/utils/enum");

const studentSchema = new Schema(
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

    // Phone number of the student (optional)
    phone: {
      type: String,
      default: null,
      trim: true,
    },

    // URL of the student's profile picture (optional)
    profile_picture_url: {
      type: String,
      default: null,
      trim: true,
    },

    // Reference to the associated school
    school_id: {
      type: Types.ObjectId,
      ref: "School",
      required: true,
    },

    // Student number (optional)
    student_number: {
      type: String,
      default: null,
      trim: true,
    },

    // Gender of the student (required enum: MALE, FEMALE)
    gender: {
      type: String,
      enum: STUDENT.VALID_GENDER,
      required: true,
    },

    // Birth information of the student (place and date)
    birth: {
      place: {
        type: String,
        required: true,
        trim: true,
      },
      date: {
        type: Date,
        required: true,
      },
    },

    // Current status of the student (required enum: PENDING, ACTIVE, DELETED)
    student_status: {
      type: String,
      enum: STUDENT.VALID_STATUS,
      required: true,
    },

    // Indicates whether the student has a scholarship (required boolean)
    scholarship: {
      type: Boolean,
      required: true,
    },

    // Academic status of the student (optional enum: ENROLLED, GRADUATED, DROPPED_OUT, TRANSFERRED)
    academic_status: {
      type: String,
      enum: STUDENT.ACADEMIC_STATUS,
      default: null,
    },

    // Enrollment date (optional)
    enrollment_date: {
      type: Date,
      default: null,
    },

    // Graduation date (optional)
    graduation_date: {
      type: Date,
      default: null,
    },

    // Dropped out date (optional)
    dropped_out_date: {
      type: Date,
      default: null,
    },

    // Transferred date (optional)
    transferred_date: {
      type: Date,
      default: null,
    },

    // Last update timestamp by system
    updated_at: {
      type: Date,
      default: null,
    },

    // User ID of the last updater (optional)
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },

    // Creation timestamp by system
    created_at: {
      type: Date,
    },

    // User ID of the creator
    created_by: {
      type: String,
    },

    // Marks soft deletion timestamp (null if not deleted)
    deleted_at: {
      type: Date,
      default: null,
    },

    // User ID of the person who deleted the record (optional)
    deleted_by: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// *************** EXPORT MODULE ***************
module.exports = model("Student", studentSchema);

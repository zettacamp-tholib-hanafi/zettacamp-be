/**
 * Student Model
 * ----------------------
 * Represents a student in the system.
 */

const { Schema, model, Types } = require('mongoose');

/* ---------------------------------- Schema --------------------------------- */

const StudentSchema = new Schema(
  {
    /* --------------------------- Required Fields --------------------------- */
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    schoolId: {
      type: Types.ObjectId,
      ref: 'School',
      required: true,
    },

    /* --------------------------- Optional Fields --------------------------- */
    dateOfBirth: {
      type: Date,
    },

    /* ---------------------------- Soft Deletion ---------------------------- */
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* --------------------------------- Export ---------------------------------- */

module.exports = model('Student', StudentSchema);

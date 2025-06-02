/**
 * School Model
 * ----------------------
 * Represents a school in the system.
 */
const { Schema, model, virtual } = require('mongoose');

/* ---------------------------------- Schema --------------------------------- */

const schoolSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: null,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Virtual: one-to-many relationship to students
virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'schoolId',
});

module.exports = model('School', schoolSchema);

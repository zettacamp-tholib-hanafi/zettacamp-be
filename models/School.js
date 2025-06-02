/**
 * User Model
 * ----------------------
 * Represents a system user.
 */

const { Schema, model } = require('mongoose');

/* ---------------------------------- Schema --------------------------------- */

const UserSchema = new Schema(
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
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },

    /* ---------------------------- Soft Deletion ---------------------------- */
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ---------------------------- Schema Options ------------------------------- */

// Exclude password from JSON output
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

/* --------------------------------- Export ---------------------------------- */

module.exports = model('User', UserSchema);

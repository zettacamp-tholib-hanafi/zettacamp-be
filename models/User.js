/**
 * User Model
 * ----------------------
 * Represents a user in the system.
 */

const { Schema, model } = require('mongoose');

/* ---------------------------------- Schema --------------------------------- */

const userSchema = new Schema(
    /* --------------------------- Required Fields --------------------------- */
    {
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
    }
);

/* --------------------------------- Export ---------------------------------- */

module.exports = model('User', userSchema);
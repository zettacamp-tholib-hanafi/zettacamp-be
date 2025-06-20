// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require("mongoose");

const VALID_BLOCK_STATUS = ["ACTIVE", "ARCHIVED", "DELETED"];
const VALID_BLOCK_PASSING_CRITERIA = ["AND", "OR"];

const blockSchema = new Schema(
  {
    // Name of the academic block
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional short description
    description: {
      type: String,
      default: null,
      trim: true,
    },

    // Status of the block
    block_status: {
      type: String,
      required: true,
      enum: VALID_BLOCK_STATUS,
      trim: true,
    },

    // Passing criteria Operator of the block
    passing_criteria_operator: {
      type: String,
      enum: VALID_BLOCK_PASSING_CRITERIA,
      trim: true,
    },

    // Start date of the block
    start_date: {
      type: Date,
      required: true,
    },

    // Optional end date of the block
    end_date: {
      type: Date,
      default: null,
    },

    // Optional list of subject references
    subjects: [
      {
        type: Types.ObjectId,
        ref: "Subject",
      },
    ],

    // Audit trail
    created_by: {
      type: String,
      default: null,
      trim: true,
    },
    updated_by: {
      type: String,
      default: null,
      trim: true,
    },

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
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// *************** EXPORT MODEL ***************
module.exports = model("Block", blockSchema);

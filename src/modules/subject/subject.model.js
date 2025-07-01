// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require("mongoose");

// ************** IMPORT UTILITIES *************
const {
  SUBJECT,
  LOGIC_ENUM,
  OPERATOR_ENUM,
  VALID_EXPECTED_OUTCOME,
} = require("../../shared/utils/enum");

const subjectSchema = new Schema(
  {
    // Subject name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Unique subject code
    subject_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Optional description
    description: {
      type: String,
      default: null,
      trim: true,
    },

    // Subject level (enum)
    level: {
      type: String,
      required: true,
      enum: SUBJECT.VALID_LEVEL,
      trim: true,
    },

    // Subject category (optional enum)
    category: {
      type: String,
      enum: SUBJECT.VALID_CATEGORY,
      default: null,
      trim: true,
    },

    // Reference to Block
    block_id: {
      type: Types.ObjectId,
      required: true,
      ref: "Block",
    },

    // Criteria of Subject

    criteria: [
      {
        logical_operator: {
          type: String,
          enum: LOGIC_ENUM,
        },
        type: {
          type: String,
          enum: SUBJECT.VALID_CONDITION_TYPE,
          required: true,
        },
        test_id: {
          type: Schema.Types.ObjectId,
          ref: "Test",
        },
        operator: {
          type: String,
          enum: OPERATOR_ENUM,
          required: true,
        },
        value: {
          type: Number,
          required: true,
          min: 0,
        },
        expected_outcome: {
          type: String,
          required: true,
          enum: VALID_EXPECTED_OUTCOME,
          trim: true,
        },
      },
    ],

    // Subject coefficient
    coefficient: {
      type: Number,
      required: true,
      min: 0,
    },

    // Related Test references
    tests: [
      {
        type: Types.ObjectId,
        ref: "Test",
      },
    ],

    // Subject status
    subject_status: {
      type: String,
      enum: SUBJECT.VALID_STATUS,
      required: true,
      trim: true,
    },

    // Audit & Soft delete

    deleted_at: {
      type: Date,
      default: null,
    },
    deleted_by: {
      type: String,
      default: null,
      trim: true,
    },
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
module.exports = model("Subject", subjectSchema);

// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require("mongoose");

// *************** Enum Constants
const VALID_LEVEL = ["ELEMENTARY", "MIDDLE", "HIGH"];
const VALID_CATEGORY = ["CORE", "ELECTIVE", "SUPPORT"];
const VALID_SUBJECT_STATUS = ["ACTIVE", "ARCHIVED", "DELETED"];
const DEFAULT_SUBJECT_STATUS = "ACTIVE";
const VALID_CONDITION_TYPE = ["TEST_SCORE", "AVERAGE"];
const LOGIC_ENUM = ["AND", "OR"];
const OPERATOR_ENUM = ["EQ", "GTE", "GT", "LTE", "LT"];
const VALID_EXPECTED_OUTCOME = ["PASS", "FAIL"];

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
      enum: VALID_LEVEL,
      trim: true,
    },

    // Subject category (optional enum)
    category: {
      type: String,
      enum: VALID_CATEGORY,
      default: null,
      trim: true,
    },

    // Reference to Block
    block_id: {
      type: Types.ObjectId,
      required: true,
      ref: "Block",
    },

    // Passing Criteria of Subject
    criteria: {
      logic: { type: String, enum: LOGIC_ENUM, required: true },
      rules: [
        {
          type: {
            type: String,
            enum: VALID_CONDITION_TYPE,
            required: true,
          },
          test_id: { type: Schema.Types.ObjectId, ref: "Test" },
          operator: {
            type: String,
            enum: OPERATOR_ENUM,
            required: true,
          },
          value: { type: Number, required: true },
          expected_outcome: {
            type: String,
            required: true,
            enum: VALID_EXPECTED_OUTCOME,
            trim: true,
          },
        },
      ],
    },

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
      enum: VALID_SUBJECT_STATUS,
      default: DEFAULT_SUBJECT_STATUS,
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

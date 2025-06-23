// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require("mongoose");

const VALID_BLOCK_STATUS = ["ACTIVE", "ARCHIVED", "DELETED"];
const LOGIC_ENUM = ["AND", "OR"];
const BLOCK_RULE_TYPE_ENUM = [
  "SUBJECT_PASS_STATUS",
  "TEST_PASS_STATUS",
  "BLOCK_AVERAGE",
];
const OPERATOR_ENUM = ["EQ", "GTE", "GT", "LTE", "LT"];

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
    passing_criteria: {
      logic: { type: String, enum: LOGIC_ENUM, required: true },
      rules: [
        {
          type: {
            type: String,
            enum: BLOCK_RULE_TYPE_ENUM,
            required: true,
          },
          subject_id: { type: Schema.Types.ObjectId, ref: "Subject" },
          test_id: { type: Schema.Types.ObjectId, ref: "Test" },
          operator: { type: String, enum: OPERATOR_ENUM, required: true },
          value: { type: Number, required: true },
        },
      ],
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

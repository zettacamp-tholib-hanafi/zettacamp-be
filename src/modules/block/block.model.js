// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require("mongoose");

// ************** IMPORT UTILITIES *************
const {
  BLOCK,
  LOGIC_ENUM,
  OPERATOR_ENUM,
  EXPECTED_OUTCOME_ENUM,
} = require("../../shared/utils/enum");

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
      enum: BLOCK.VALID_STATUS,
      trim: true,
    },

    // Criteria Operator of the block

    criteria: [
      {
        logical_operator: {
          type: String,
          enum: LOGIC_ENUM,
        },
        type: {
          type: String,
          enum: BLOCK.RULE_TYPE,
          required: true,
        },
        subject_id: {
          type: Schema.Types.ObjectId,
          ref: "Subject",
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
          enum: EXPECTED_OUTCOME_ENUM,
          trim: true,
        },
      },
    ],

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

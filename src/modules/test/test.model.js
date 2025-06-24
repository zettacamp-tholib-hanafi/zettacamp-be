// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require("mongoose");

// ************** IMPORT UTILS ***************
const {
  TEST,
  LOGIC_ENUM,
  OPERATOR_ENUM,
  EXPECTED_OUTCOME_ENUM,
} = require("../../shared/utils/enum");

// *************** DEFINE SCHEMA ***************
const testSchema = new Schema(
  {
    // Name of the test
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Reference to the subject this test belongs to
    subject_id: {
      type: Types.ObjectId,
      required: true,
      ref: "Subject",
    },

    // Optional test description
    description: {
      type: String,
      default: null,
      trim: true,
    },

    // Weight of this test in the subject’s final grade
    weight: {
      type: Number,
      required: true,
      min: 0,
    },

    // List of evaluation components directly nested
    notations: [
      {
        notation_text: {
          type: String,
          required: true,
          trim: true,
        },
        max_points: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // Optional computed total score from all notations
    total_score: {
      type: Number,
      default: null,
    },

    // Grading mechanism
    grading_method: {
      type: String,
      enum: TEST.VALID_GRADING_METHOD,
      default: TEST.DEFAULT_GRADING_METHOD,
      trim: true,
    },

    // Test passing criteria
    criteria: {
      logic: {
        type: String,
        enum: LOGIC_ENUM,
        required: true,
      },
      rules: [
        {
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
            enum: EXPECTED_OUTCOME_ENUM,
            required: true,
          },
        },
      ],
    },

    // Status of the test
    test_status: {
      type: String,
      enum: TEST.VALID_STATUS,
      default: TEST.DEFAULT_STATUS,
      required: true,
      trim: true,
    },

    // Optional list of file URLs or links
    attachments: {
      type: [String],
      default: [],
    },

    // Date when the test was published
    published_date: {
      type: Date,
      default: null,
    },

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
module.exports = model("Test", testSchema);

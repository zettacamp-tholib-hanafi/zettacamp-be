// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require("mongoose");

const VALID_TEST_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED", "DELETED"];
const DEFAULT_TEST_STATUS = "DRAFT";
const VALID_GRADING_METHOD = ["MANUAL", "AUTO_GRADED"];
const DEFAULT_GRADING_METHOD = "MANUAL";

const testSchema = new Schema(
  {
    // Name of the test (e.g., "Final Exam", "Quiz 1")
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
        // Description of what is being evaluated (e.g., "Clarity")
        notation_text: {
          type: String,
          required: true,
          trim: true,
        },

        // Maximum possible points for this component
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
      enum: VALID_GRADING_METHOD,
      default: DEFAULT_GRADING_METHOD,
      trim: true,
    },

    // Minimum required score to pass the test
    passing_score: {
      type: Number,
      default: null,
      min: 0,
    },

    // Status of the test
    test_status: {
      type: String,
      required: true,
      enum: VALID_TEST_STATUS,
      default: DEFAULT_TEST_STATUS,
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

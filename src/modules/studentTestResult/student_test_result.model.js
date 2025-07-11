// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require("mongoose");

const VALID_STUDENT_TEST_RESULT_STATUS = [
  "GRADED",
  "PENDING_REVIEW",
  "NEEDS_CORRECTION",
  "DELETED",
];
const DEFAULT_STUDENT_TEST_RESULT_STATUS = "PENDING_REVIEW";

const studentTestResultSchema = new Schema(
  {
    // Reference to the student this result belongs to
    student_id: {
      type: Types.ObjectId,
      required: true,
      ref: "Student",
    },

    // Reference to the test being evaluated
    test_id: {
      type: Types.ObjectId,
      required: true,
      ref: "Test",
    },

    // Array of marks for each evaluated notation in the test
    marks: [
      {
        // Description of the evaluation criteria (e.g., "Clarity")
        notation_text: {
          type: String,
          required: true,
          trim: true,
        },

        // Actual score given to the student for this notation
        mark: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // Average score across all notations
    average_mark: {
      type: Number,
      required: true,
      min: 0,
    },

    // Date when the marks were entered
    mark_entry_date: {
      type: Date,
      default: Date.now,
    },

    // Date when the marks were validated
    mark_validated_date: {
      type: Date,
    },

    // ID of the corrector or teacher who graded the test
    graded_by: {
      type: String,
      ref: "User",
    },

    // Optional comment or feedback from the grader
    remarks: {
      type: String,
      default: null,
      trim: true,
    },

    // Status of the student test result
    student_test_result_status: {
      type: String,
      enum: VALID_STUDENT_TEST_RESULT_STATUS,
      default: DEFAULT_STUDENT_TEST_RESULT_STATUS,
      trim: true,
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

// *************** EXPORT MODULE ***************
module.exports = model("StudentTestResult", studentTestResultSchema);

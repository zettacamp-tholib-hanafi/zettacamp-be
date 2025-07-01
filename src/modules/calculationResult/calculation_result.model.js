// *************** IMPORT LIBRARY ***************
const mongoose = require("mongoose");
const { Schema } = mongoose;

// *************** IMPORT UTILITIES ***************
const {
  EXPECTED_OUTCOME_ENUM,
  CALCULATION_RESULT,
} = require("../../shared/utils/enum");

const CalculationResultSchema = new Schema(
  {
    student_id: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    overall_result: {
      type: String,
      enum: EXPECTED_OUTCOME_ENUM,
      required: true,
    },

    results: [
      {
        block_id: {
          type: Schema.Types.ObjectId,
          ref: "Block",
          required: true,
        },

        block_result: {
          type: String,
          enum: EXPECTED_OUTCOME_ENUM,
          required: true,
        },

        total_mark: {
          type: Number,
          required: true,
        },

        subject_results: [
          {
            subject_id: {
              type: Schema.Types.ObjectId,
              ref: "Subject",
              required: true,
            },

            subject_result: {
              type: String,
              enum: EXPECTED_OUTCOME_ENUM,
              required: true,
            },

            total_mark: {
              type: Number,
              required: true,
            },

            test_results: [
              {
                test_id: {
                  type: Schema.Types.ObjectId,
                  ref: "Test",
                  required: true,
                },

                test_result: {
                  type: String,
                  enum: EXPECTED_OUTCOME_ENUM,
                  required: true,
                },

                average_mark: {
                  type: Number,
                  required: true,
                },

                weighted_mark: {
                  type: Number,
                  required: true,
                },
              },
            ],
          },
        ],
      },
    ],

    calculation_result_status: {
      type: String,
      enum: CALCULATION_RESULT.VALID_STATUS,
      required: true,
      default: CALCULATION_RESULT.DEFAULT_STATUS,
    },

    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updated_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    deleted_at: {
      type: Date,
    },

    deleted_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// *************** EXPORT MODULE ***************
module.exports = mongoose.model("CalculationResult", CalculationResultSchema);

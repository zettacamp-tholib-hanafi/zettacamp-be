// *************** IMPORT LIBRARY ***************
const mongoose = require("mongoose");
const { Schema } = mongoose;

const LOGIC_ENUM = ["AND", "OR"];
const BLOCK_RULE_TYPE_ENUM = [
  "SUBJECT_PASS_STATUS",
  "TEST_PASS_STATUS",
  "BLOCK_AVERAGE",
];
const SUBJECT_RULE_TYPE_ENUM = ["TEST_SCORE", "AVERAGE"];
const OPERATOR_ENUM = ["==", ">=", ">", "<=", "<"];
const RESULT_ENUM = ["PASS", "FAIL"];
const VALID_CALCULATION_RESULT_STATUS = ["PUBLISHED", "ARCHIVED", "DELETED"];
const DEFAULT_CALCULATION_RESULT_STATUS = "PUBLISHED";

const CalculationResultSchema = new Schema(
  {
    student_id: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    results: [
      {
        block_id: {
          type: Schema.Types.ObjectId,
          ref: "Block",
          required: true,
        },
        criteria: {
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
        block_result: {
          type: String,
          enum: RESULT_ENUM,
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
            criteria: {
              logic: { type: String, enum: LOGIC_ENUM, required: true },
              rules: [
                {
                  type: {
                    type: String,
                    enum: SUBJECT_RULE_TYPE_ENUM,
                    required: true,
                  },
                  test_id: { type: Schema.Types.ObjectId, ref: "Test" },
                  operator: {
                    type: String,
                    enum: OPERATOR_ENUM,
                    required: true,
                  },
                  value: { type: Number, required: true },
                },
              ],
            },
            subject_result: {
              type: String,
              enum: RESULT_ENUM,
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
                criteria: {
                  operator: {
                    type: String,
                    enum: OPERATOR_ENUM,
                    required: true,
                  },
                  value: { type: Number, required: true },
                },
                test_result: {
                  type: String,
                  enum: RESULT_ENUM,
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
      enum: VALID_CALCULATION_RESULT_STATUS,
      default: DEFAULT_CALCULATION_RESULT_STATUS,
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
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// *************** EXPORT MODEL ***************
module.exports = mongoose.model("CalculationResult", CalculationResultSchema);

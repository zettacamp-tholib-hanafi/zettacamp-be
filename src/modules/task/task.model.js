// *************** IMPORT LIBRARY ***************
const { Schema, model, Types } = require("mongoose");

const VALID_TASK_TYPES = ["ASSIGN_CORRECTOR", "ENTER_MARKS", "VALIDATE_MARKS"];

const VALID_TASK_STATUSES = ["PENDING", "PROGRESS", "COMPLETED", "DELETED"];

const DEFAULT_TASK_STATUS = "PENDING";

const taskSchema = new Schema(
  {
    // Reference to the related test
    test_id: {
      type: Types.ObjectId,
      required: true,
      ref: "Test",
    },

    // Reference to the user assigned to the task
    user_id: {
      type: Types.ObjectId,
      required: true,
      ref: "User",
    },

    // Type of the task (e.g., ASSIGN_CORRECTOR)
    task_type: {
      type: String,
      required: true,
      enum: VALID_TASK_TYPES,
      trim: true,
    },

    // Current status of the task
    task_status: {
      type: String,
      required: true,
      enum: VALID_TASK_STATUSES,
      default: DEFAULT_TASK_STATUS,
      trim: true,
    },

    // Deadline for the task
    due_date: {
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

// *************** EXPORT MODULE ***************
module.exports = model("Task", taskSchema);

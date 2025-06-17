// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error.js");

// *************** Constant Enums
const VALID_TASK_TYPES = ["ASSIGN_CORRECTOR", "ENTER_MARKS", "VALIDATE_MARKS"];
const VALID_TASK_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "DELETED"];

/**
 * ValidateCreateTask
 * ----------------------------------------------------------------
 * Validates input for creating a new Task. Ensures required fields
 * are present and enums are valid.
 *
 * @param {Object} input - Raw input payload from GraphQL resolver.
 * @param {string} input.test_id - ID of the associated test (required).
 * @param {string} input.user_id - ID of the user assigned to the task (required).
 * @param {string} input.task_type - Task type (required, must match VALID_TASK_TYPES).
 * @param {string} [input.task_status] - Optional status (must match VALID_TASK_STATUSES, default = "PENDING").
 * @param {Date|string} [input.due_date] - Optional due date.
 *
 * @returns {Promise<Object>} Validated and sanitized input.
 *
 * @throws {AppError} If validation fails.
 */
async function ValidateCreateTask(input) {
  const errors = {};

  if (
    !input.test_id ||
    typeof input.test_id !== "string" ||
    input.test_id.trim() === ""
  ) {
    errors.test_id = "test_id is required and must be a non-empty string";
  }

  if (
    !input.user_id ||
    typeof input.user_id !== "string" ||
    input.user_id.trim() === ""
  ) {
    errors.user_id = "user_id is required and must be a non-empty string";
  }

  if (input.task_status && !VALID_TASK_TYPES.includes(input.task_type)) {
    errors.task_type = `task_type must be one of: ${VALID_TASK_TYPES.join(
      ", "
    )}`;
  }

  if (input.task_status && !VALID_TASK_STATUSES.includes(input.task_status)) {
    errors.task_status = `task_status must be one of: ${VALID_TASK_STATUSES.join(
      ", "
    )}`;
  }

  if (input.due_date) {
    const date = new Date(input.due_date);
    if (isNaN(date.getTime())) {
      errors.due_date = "due_date must be a valid date";
    }
  }

  if (Object.keys(errors).length > 0) {
    throw CreateAppError("Validation failed", "VALIDATION_ERROR", errors);
  }

  return {
    test_id: input.test_id,
    user_id: input.user_id,
    task_type: input.task_type,
    task_status: input.task_status || "PENDING",
    due_date: input.due_date ? new Date(input.due_date) : null,
  };
}

/**
 * ValidateUpdateTask
 * ----------------------------------------------------------------
 * Validates and sanitizes the input payload for updating an existing Task.
 * Ensures required fields are present, enum values are valid, and the due date is properly formatted.
 *
 * @param {Object} input - The input payload for updating a task.
 * @param {string} input.test_id - ID of the associated test (required).
 * @param {string} input.user_id - ID of the user assigned to the task (required).
 * @param {string} [input.task_type] - Task type (optional, must match VALID_TASK_TYPES if provided).
 * @param {string} [input.task_status] - Task status (optional, must match VALID_TASK_STATUSES if provided).
 * @param {Date|string} [input.due_date] - Optional due date (must be a valid date if provided).
 *
 * @returns {Promise<Object>} Sanitized and validated input object:
 * {
 *   test_id: string,
 *   user_id: string,
 *   task_type?: string,
 *   task_status: string,
 *   due_date: Date|null
 * }
 *
 * @throws {AppError} If validation fails due to missing or invalid fields.
 */

async function ValidateUpdateTask(input) {
  const errors = {};

  if (
    !input.test_id ||
    typeof input.test_id !== "string" ||
    input.test_id.trim() === ""
  ) {
    errors.test_id = "test_id is required and must be a non-empty string";
  }

  if (
    !input.user_id ||
    typeof input.user_id !== "string" ||
    input.user_id.trim() === ""
  ) {
    errors.user_id = "user_id is required and must be a non-empty string";
  }

  if (input.task_status && !VALID_TASK_TYPES.includes(input.task_type)) {
    errors.task_type = `task_type must be one of: ${VALID_TASK_TYPES.join(
      ", "
    )}`;
  }

  if (input.task_status && !VALID_TASK_STATUSES.includes(input.task_status)) {
    errors.task_status = `task_status must be one of: ${VALID_TASK_STATUSES.join(
      ", "
    )}`;
  }

  if (input.due_date) {
    const date = new Date(input.due_date);
    if (isNaN(date.getTime())) {
      errors.due_date = "due_date must be a valid date";
    }
  }

  if (Object.keys(errors).length > 0) {
    throw CreateAppError("Validation failed", "VALIDATION_ERROR", errors);
  }

  return {
    test_id: input.test_id,
    user_id: input.user_id,
    task_type: input.task_type,
    task_status: input.task_status || "PENDING",
    due_date: input.due_date ? new Date(input.due_date) : null,
  };
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateCreateTask,
  ValidateUpdateTask,
};

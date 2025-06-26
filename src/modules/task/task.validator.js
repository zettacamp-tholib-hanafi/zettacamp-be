// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error.js");

// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT MODULE ***************
const Task = require("./task.model.js");
const Test = require("../test/test.model.js");
const User = require("../user/user.model.js");

// *************** Constant Enums
const VALID_TASK_TYPES = ["ASSIGN_CORRECTOR", "ENTER_MARKS", "VALIDATE_MARKS"];
const VALID_TASK_STATUSES = ["PENDING", "PROGRESS", "COMPLETED", "DELETED"];

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
  const { test_id, user_id, task_type, task_status, due_date } = input;

  if (!test_id) {
    errors.test_id = "test_id is required and must be a non-empty string";
  }
  const foundTest = await Test.findOne({
    _id: test_id,
    test_status: { $ne: "DELETED" },
  });

  if (!foundTest) {
    throw CreateAppError("Test not found or has been deleted", "NOT_FOUND", {
      test_id: test_id,
    });
  }

  if (!user_id || typeof user_id !== "string" || user_id.trim() === "") {
    errors.user_id = "user_id is required and must be a non-empty string";
  }

  const foundUser = await User.findOne({
    _id: user_id,
    user_status: { $ne: "DELETED" },
  });

  if (!foundUser) {
    throw CreateAppError("User not found or has been deleted", "NOT_FOUND", {
      user_id: user_id,
    });
  }

  if (task_type && !VALID_TASK_TYPES.includes(task_type)) {
    errors.task_type = `task_type must be one of: ${VALID_TASK_TYPES.join(
      ", "
    )}`;
  }

  if (task_status && !VALID_TASK_STATUSES.includes(task_status)) {
    errors.task_status = `task_status must be one of: ${VALID_TASK_STATUSES.join(
      ", "
    )}`;
  }

  if (due_date) {
    const date = new Date(due_date);
    if (isNaN(date.getTime())) {
      errors.due_date = "due_date must be a valid date";
    }
  }

  if (Object.keys(errors).length > 0) {
    throw CreateAppError("Validation failed", "VALIDATION_ERROR", errors);
  }

  const callbackTaskPayload = {
    test_id: test_id,
    user_id: user_id,
    task_type: task_type,
    task_status: task_status || "PENDING",
    due_date: due_date ? new Date(due_date) : null,
  };
  return callbackTaskPayload;
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

  const callbackTestPayload = {
    test_id: input.test_id,
    user_id: input.user_id,
    task_type: input.task_type,
    task_status: input.task_status || "PENDING",
    due_date: input.due_date ? new Date(input.due_date) : null,
  };
  return callbackTestPayload;
}

/**
 * Validates input and checks the task existence for assigning a corrector.
 *
 * @param {String} taskId - The task ID to validate
 * @param {Object} input - Input object containing user_id and due_date
 * @returns {Object} - Validated and resolved data: { user_id, due_date, assignTask }
 * @throws {AppError} - If validation fails or task not found
 */
async function ValidateAssignCorrector(taskId, input) {
  const { user_id, due_date } = input;

  if (!isValidObjectId(user_id)) {
    throw CreateAppError("Invalid corrector user_id", 400, "VALIDATION_ERROR");
  }

  if (!isValidObjectId(taskId)) {
    throw CreateAppError("Invalid task ID", 400, "VALIDATION_ERROR");
  }

  const assignTask = await Task.findOne({
    _id: taskId,
    task_type: "ASSIGN_CORRECTOR",
    task_status: "PENDING",
  });

  if (!assignTask) {
    throw CreateAppError(
      "Assign Corrector task not found or already completed",
      404,
      "NOT_FOUND"
    );
  }

  const callbackValidateAssignPayload = {
    user_id,
    due_date: due_date || null,
    assignTask,
  };
  return callbackValidateAssignPayload;
}

/**
 * @function ValidateEnterMarks
 * @description Validates input for EnterMarks mutation and fetches matching task
 * @param {String} test_id - ID of the test
 * @param {Object} input - Input payload including marks, student_id, and user_id
 * @returns {Object} Validated fields: marks, user_id, student_id, task, due_date
 */
async function ValidateEnterMarks(test_id, input) {
  // *************** Sanity Checks
  if (!mongoose.Types.ObjectId.isValid(test_id)) {
    throw CreateAppError("Invalid test_id", 400, "VALIDATION_ERROR");
  }

  const { student_id, marks, user_id } = input;

  if (!mongoose.Types.ObjectId.isValid(student_id)) {
    throw CreateAppError("Invalid student_id", 400, "VALIDATION_ERROR");
  }

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    throw CreateAppError("Invalid user_id", 400, "VALIDATION_ERROR");
  }

  if (!Array.isArray(marks) || marks.length === 0) {
    throw CreateAppError(
      "Marks must be a non-empty array",
      400,
      "VALIDATION_ERROR"
    );
  }

  for (const [i, mark] of marks.entries()) {
    if (
      !mark ||
      !mongoose.Types.ObjectId.isValid(mark.notation_id) ||
      typeof mark.mark !== "number" ||
      mark.mark < 0 ||
      mark.mark > 100
    ) {
      throw CreateAppError(
        `Invalid mark at index ${i}: notation_id and mark required (0-100)`,
        400,
        "VALIDATION_ERROR"
      );
    }
  }

  // *************** Fetch ENTER_MARKS Task
  const task = await Task.findOne({
    test_id,
    user_id: user_id,
    type: "ENTER_MARKS",
    status: "PENDING",
  });

  if (!task) {
    throw CreateAppError(
      "No pending ENTER_MARKS task found for this test and user",
      404,
      "TASK_NOT_FOUND"
    );
  }

  const callbackValidateEnterMarksPayload = {
    marks,
    user_id,
    student_id,
    task,
    due_date: task.due_date || null,
  };
  return callbackValidateEnterMarksPayload;
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateCreateTask,
  ValidateUpdateTask,
  ValidateAssignCorrector,
  ValidateEnterMarks,
};

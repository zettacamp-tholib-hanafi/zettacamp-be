// *************** IMPORT LIBRARY ***************

// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT MODULE ***************
const Test = require("../test/test.model");
const StudentTestResult = require("./student_test_result.model");
const Task = require("../task/task.model");

const StudentTestResultStatusEnum = [
  "GRADED",
  "PENDING_REVIEW",
  "NEEDS_CORRECTION",
];

/**
 * Validate input for creating a new StudentTestResult.
 *
 * This function ensures that required fields are present and valid, including
 * mark boundaries, valid references, and enum values.
 *
 * @param {Object} input - Input object for StudentTestResult creation.
 * @returns {Promise<Object>} Validated and sanitized input object.
 * @throws {AppError} If any validation rule fails.
 */
async function ValidateCreateStudentTestResult(input) {
  const {
    student_id,
    test_id,
    marks,
    average_mark,
    mark_entry_date,
    graded_by,
    remarks,
    student_test_result_status,
  } = input;

  if (
    !student_id ||
    typeof student_id !== "string" ||
    student_id.trim() === ""
  ) {
    throw CreateAppError(
      "student_id is required and must be a non-empty string",
      "BAD_REQUEST",
      {
        student_id,
      }
    );
  }

  if (!test_id || typeof test_id !== "string" || test_id.trim() === "") {
    throw CreateAppError(
      "test_id is required and must be a non-empty string",
      "BAD_REQUEST",
      {
        test_id,
      }
    );
  }

  if (!Array.isArray(marks) || marks.length === 0) {
    throw CreateAppError("marks must be a non-empty array", "BAD_REQUEST", {
      marks,
    });
  }

  if (
    !student_test_result_status ||
    !StudentTestResultStatusEnum.includes(student_test_result_status)
  ) {
    throw CreateAppError(
      "Invalid student_test_result_status value",
      "BAD_REQUEST",
      { student_test_result_status }
    );
  }

  const test = await Test.findById(test_id);
  if (!test) {
    throw CreateAppError("Associated test not found", "NOT_FOUND", { test_id });
  }

  const maxTotalScore =
    typeof test.total_score === "number" ? test.total_score : 100;

  marks.forEach((mark, index) => {
    if (
      !mark.notation_text ||
      typeof mark.notation_text !== "string" ||
      mark.notation_text.trim() === ""
    ) {
      throw CreateAppError(
        `notation_text in marks[${index}] is required and must be a non-empty string`,
        "BAD_REQUEST",
        { notation: mark }
      );
    }

    if (
      typeof mark.mark !== "number" ||
      mark.mark < 0 ||
      mark.mark > maxTotalScore
    ) {
      throw CreateAppError(
        `mark in marks[${index}] must be a number between 0 and total_score (${maxTotalScore})`,
        "BAD_REQUEST",
        { notation: mark }
      );
    }

    const matchedNotation = Array.isArray(test.notations)
      ? test.notations.find(
          (notation) => notation.notation_text === mark.notation_text
        )
      : null;

    if (!matchedNotation) {
      throw CreateAppError(
        `Notation "${mark.notation_text}" does not exist in the test definition`,
        "BAD_REQUEST",
        { notation: mark }
      );
    }

    if (mark.mark > matchedNotation.max_points) {
      throw CreateAppError(
        `mark in marks[${index}] exceeds max_points (${matchedNotation.max_points}) for notation "${mark.notation_text}"`,
        "BAD_REQUEST",
        { notation: mark }
      );
    }
  });

  const callbackStudentTestResultPayload = {
    student_id: student_id.trim(),
    test_id: test_id.trim(),
    marks,
    average_mark,
    mark_entry_date: mark_entry_date || null,
    graded_by: graded_by || null,
    remarks: remarks || null,
    student_test_result_status,
  };
  return callbackStudentTestResultPayload;
}

/**
 * ValidateUpdateStudentTestResult
 * ---------------------------------------------------------------
 * Validates the input payload for updating a student test result.
 * Performs thorough checks on required fields, ensures marks are valid,
 * and validates each mark against the corresponding test notation.
 *
 * Throws meaningful application errors if any validation fails.
 *
 * @async
 * @function ValidateUpdateStudentTestResult
 *
 * @param {Object} input - The input object containing update data.
 * @param {string} input.student_id - ID of the student (required, non-empty string).
 * @param {string} input.test_id - ID of the test (required, non-empty string).
 * @param {Array<Object>} input.marks - Array of marks for each notation.
 * @param {string} input.marks[].notation_text - Notation description (required).
 * @param {number} input.marks[].mark - Mark for the notation (must be within allowed range).
 * @param {number} input.average_mark - Average mark (must be between 0 and 100).
 * @param {string|null} [input.mark_entry_date] - Optional date of mark entry.
 * @param {string|null} [input.graded_by] - Optional user ID of the corrector.
 * @param {string|null} [input.remarks] - Optional remarks for the result.
 * @param {string} input.student_test_result_status - Status of the result (must match enum).
 *
 * @throws {AppError} If any required field is missing, improperly typed, or invalid.
 * @throws {AppError} If test is not found by the given `test_id`.
 * @throws {AppError} If any mark exceeds the `max_points` of its corresponding test notation.
 *
 * @returns {Promise<Object>} Returns the validated and sanitized payload:
 * {
 *   student_id: string,
 *   test_id: string,
 *   marks: Array<Object>,
 *   average_mark: number,
 *   mark_entry_date: string|null,
 *   graded_by: string|null,
 *   remarks: string|null,
 *   student_test_result_status: string
 * }
 */

async function ValidateUpdateStudentTestResult(input) {
  const {
    student_id,
    test_id,
    marks,
    average_mark,
    mark_entry_date,
    graded_by,
    remarks,
    student_test_result_status,
  } = input;

  if (
    !student_id ||
    typeof student_id !== "string" ||
    student_id.trim() === ""
  ) {
    throw CreateAppError(
      "student_id is required and must be a non-empty string",
      "BAD_REQUEST",
      {
        student_id,
      }
    );
  }

  if (!test_id || typeof test_id !== "string" || test_id.trim() === "") {
    throw CreateAppError(
      "test_id is required and must be a non-empty string",
      "BAD_REQUEST",
      {
        test_id,
      }
    );
  }

  if (!Array.isArray(marks) || marks.length === 0) {
    throw CreateAppError("marks must be a non-empty array", "BAD_REQUEST", {
      marks,
    });
  }

  if (
    !student_test_result_status ||
    !StudentTestResultStatusEnum.includes(student_test_result_status)
  ) {
    throw CreateAppError(
      "Invalid student_test_result_status value",
      "BAD_REQUEST",
      { student_test_result_status }
    );
  }

  const test = await Test.findById(test_id);
  if (!test) {
    throw CreateAppError("Associated test not found", "NOT_FOUND", { test_id });
  }

  const maxTotalScore =
    typeof test.total_score === "number" ? test.total_score : 100;

  marks.forEach((mark, index) => {
    if (
      !mark.notation_text ||
      typeof mark.notation_text !== "string" ||
      mark.notation_text.trim() === ""
    ) {
      throw CreateAppError(
        `notation_text in marks[${index}] is required and must be a non-empty string`,
        "BAD_REQUEST",
        { notation: mark }
      );
    }

    if (
      typeof mark.mark !== "number" ||
      mark.mark < 0 ||
      mark.mark > maxTotalScore
    ) {
      throw CreateAppError(
        `mark in marks[${index}] must be a number between 0 and total_score (${maxTotalScore})`,
        "BAD_REQUEST",
        { notation: mark }
      );
    }

    const matchedNotation = Array.isArray(test.notations)
      ? test.notations.find(
          (notation) => notation.notation_text === mark.notation_text
        )
      : null;

    if (!matchedNotation) {
      throw CreateAppError(
        `Notation "${mark.notation_text}" does not exist in the test definition`,
        "BAD_REQUEST",
        { notation: mark }
      );
    }

    if (mark.mark > matchedNotation.max_points) {
      throw CreateAppError(
        `mark in marks[${index}] exceeds max_points (${matchedNotation.max_points}) for notation "${mark.notation_text}"`,
        "BAD_REQUEST",
        { notation: mark }
      );
    }
  });

  const callbackStudentTestResultPayload = {
    student_id: student_id.trim(),
    test_id: test_id.trim(),
    marks,
    average_mark,
    mark_entry_date: mark_entry_date || null,
    graded_by: graded_by || null,
    remarks: remarks || null,
    student_test_result_status,
  };
  return callbackStudentTestResultPayload;
}
/**
 * Validate and prepare data for ValidateMarks mutation.
 *
 * @param {string} taskId - The ID of the student test result to validate.
 * @returns {Promise<{ task: object, test_result: object }>} - The corresponding task and test result.
 */
async function ValidateValidateMarks(taskId) {
  const task = await Task.findOne({
    task_type: "VALIDATE_MARKS",
    task_status: "PENDING",
    _id: taskId,
  });

  if (!task) {
    throw CreateAppError(
      "No VALIDATE_MARKS task in PENDING status for this test result",
      "NOT_FOUND"
    );
  }
  const studentTestResult = await StudentTestResult.findOne({
    test_id: task.test_id,
  });

  if (!studentTestResult) {
    throw CreateAppError("Student Test Result not found", "NOT_FOUND");
  }

  const validateMarksPayload = { task, studentTestResult };
  return validateMarksPayload;
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateCreateStudentTestResult,
  ValidateUpdateStudentTestResult,
  ValidateValidateMarks,
};

// *************** IMPORT LIBRARY ***************

// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT MODULE ***************
const Test = require("../test/test.model");

const StudentTaskResultStatusEnum = [
  "GRADED",
  "PENDING_REVIEW",
  "NEEDS_CORRECTION",
];

/**
 * Validate input for creating a new StudentTaskResult.
 *
 * This function ensures that required fields are present and valid, including
 * mark boundaries, valid references, and enum values.
 *
 * @param {Object} input - Input object for StudentTaskResult creation.
 * @returns {Promise<Object>} Validated and sanitized input object.
 * @throws {AppError} If any validation rule fails.
 */
async function ValidateCreateStudentTaskResult(input) {
  const {
    student_id,
    test_id,
    marks,
    average_mark,
    mark_entry_date,
    graded_by,
    remarks,
    student_task_result_status,
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
    typeof average_mark !== "number" ||
    average_mark < 0 ||
    average_mark > 100
  ) {
    throw CreateAppError(
      "average_mark must be a number between 0 and 100",
      "BAD_REQUEST",
      { average_mark }
    );
  }

  if (
    !student_task_result_status ||
    !StudentTaskResultStatusEnum.includes(student_task_result_status)
  ) {
    throw CreateAppError(
      "Invalid student_task_result_status value",
      "BAD_REQUEST",
      { student_task_result_status }
    );
  }

  const test = await Test.findById(test_id);
  if (!test) {
    throw CreateAppError("Associated test not found", "NOT_FOUND", { test_id });
  }

  const maxTotalScore =
    typeof test.total_score === "number" ? test.total_score : 100;

  for (let i = 0; i < marks.length; i++) {
    const item = marks[i];

    if (
      !item.notation_text ||
      typeof item.notation_text !== "string" ||
      item.notation_text.trim() === ""
    ) {
      throw CreateAppError(
        `notation_text in marks[${i}] is required and must be a non-empty string`,
        "BAD_REQUEST",
        { notation: item }
      );
    }

    if (
      typeof item.mark !== "number" ||
      item.mark < 0 ||
      item.mark > maxTotalScore
    ) {
      throw CreateAppError(
        `mark in marks[${i}] must be a number between 0 and total_score (${maxTotalScore})`,
        "BAD_REQUEST",
        { notation: item }
      );
    }

    const matchedNotation = Array.isArray(test.notations)
      ? test.notations.find((n) => n.notation_text === item.notation_text)
      : null;

    if (!matchedNotation) {
      throw CreateAppError(
        `Notation "${item.notation_text}" does not exist in the test definition`,
        "BAD_REQUEST",
        { notation: item }
      );
    }

    if (item.mark > matchedNotation.max_points) {
      throw CreateAppError(
        `mark in marks[${i}] exceeds max_points (${matchedNotation.max_points}) for notation "${item.notation_text}"`,
        "BAD_REQUEST",
        { notation: item }
      );
    }
  }

  // *************** RETURN SANITIZED INPUT ***************

  return {
    student_id: student_id.trim(),
    test_id: test_id.trim(),
    marks,
    average_mark,
    mark_entry_date: mark_entry_date || null,
    graded_by: graded_by || null,
    remarks: remarks || null,
    student_task_result_status,
  };
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateCreateStudentTaskResult,
};

// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT HELPER ***************
const { CreateAppError } = require("../../shared/helpers/createAppError");

const {
  VALID_LEVEL,
  VALID_CATEGORY,
  VALID_STATUS,
} = require("./subject.constant");

/**
 * Validates the input for creating a Subject.
 *
 * Ensures required fields are present, types are correct,
 * and enums are within valid ranges. Returns sanitized input.
 *
 * @param {Object} input - Input object for creating a subject.
 * @returns {Object} Validated and sanitized input for DB insertion.
 *
 * @throws {AppError} If any validation fails.
 */
function ValidateCreateSubject(input) {
  if (typeof input !== "object" || input === null) {
    throw CreateAppError("Invalid input format", "BAD_REQUEST");
  }

  const {
    name,
    subject_code,
    description,
    level,
    category,
    block_id,
    coefficient,
    tests,
    subject_status,
  } = input;

  // *************** Validate: name
  if (!name || typeof name !== "string" || name.trim() === "") {
    throw CreateAppError("Subject name is required", "BAD_REQUEST", { name });
  }

  // *************** Validate: subject_code
  if (
    !subject_code ||
    typeof subject_code !== "string" ||
    subject_code.trim() === ""
  ) {
    throw CreateAppError("Subject code is required", "BAD_REQUEST", {
      subject_code,
    });
  }

  // *************** Validate: level
  if (!VALID_LEVEL.includes(level)) {
    throw CreateAppError("Invalid subject level", "BAD_REQUEST", { level });
  }

  // *************** Validate: optional category
  if (category && !VALID_CATEGORY.includes(category)) {
    throw CreateAppError("Invalid subject category", "BAD_REQUEST", {
      category,
    });
  }

  // *************** Validate: block_id
  if (!block_id || !isValidObjectId(block_id)) {
    throw CreateAppError("Invalid or missing block_id", "BAD_REQUEST", {
      block_id,
    });
  }

  // *************** Validate: coefficient
  if (typeof coefficient !== "number" || coefficient < 0) {
    throw CreateAppError(
      "Coefficient must be a non-negative number",
      "BAD_REQUEST",
      { coefficient }
    );
  }

  // *************** Validate: tests (optional)
  if (
    tests &&
    (!Array.isArray(tests) || tests.some((id) => !isValidObjectId(id)))
  ) {
    throw CreateAppError(
      "Tests must be an array of valid ObjectIds",
      "BAD_REQUEST",
      { tests }
    );
  }

  // *************** Validate: subject_status
  const status = subject_status || "ACTIVE";
  if (!VALID_STATUS.includes(status)) {
    throw CreateAppError("Invalid subject status", "BAD_REQUEST", {
      subject_status,
    });
  }

  return {
    name: name.trim(),
    subject_code: subject_code.trim(),
    description: description ? description.trim() : null,
    level,
    category: category ? category : null,
    block_id,
    coefficient,
    tests: tests ? tests : [],
    subject_status: status,
  };
}

module.exports = { ValidateCreateSubject };

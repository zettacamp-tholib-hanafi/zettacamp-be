// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT HELPER ***************
const { CreateAppError } = require("../../core/error");

const VALID_LEVEL = ["ELEMENTARY", "MIDDLE", "HIGH"];
const VALID_CATEGORY = ["CORE", "ELECTIVE", "SUPPORT"];
const VALID_STATUS = ["ACTIVE", "ARCHIVED", "DELETED"];

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
    const handlingError = CreateAppError("Invalid input format", "BAD_REQUEST");
    throw handlingError;
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
    const handlingError = CreateAppError(
      "Subject name is required",
      "BAD_REQUEST",
      { name }
    );
    throw handlingError;
  }

  // *************** Validate: subject_code
  if (
    !subject_code ||
    typeof subject_code !== "string" ||
    subject_code.trim() === ""
  ) {
    const handlingError = CreateAppError(
      "Subject code is required",
      "BAD_REQUEST",
      {
        subject_code,
      }
    );
    throw handlingError;
  }

  // *************** Validate: level
  if (!VALID_LEVEL.includes(level)) {
    const handlingError = CreateAppError(
      "Invalid subject level",
      "BAD_REQUEST",
      { level }
    );
    throw handlingError;
  }

  // *************** Validate: optional category
  if (category && !VALID_CATEGORY.includes(category)) {
    const handlingError = CreateAppError(
      "Invalid subject category",
      "BAD_REQUEST",
      {
        category,
      }
    );
    throw handlingError;
  }

  // *************** Validate: block_id
  if (!block_id || !isValidObjectId(block_id)) {
    const handlingError = CreateAppError(
      "Invalid or missing block_id",
      "BAD_REQUEST",
      {
        block_id,
      }
    );
    throw handlingError;
  }

  // *************** Validate: coefficient
  if (typeof coefficient !== "number" || coefficient < 0) {
    const handlingError = CreateAppError(
      "Coefficient must be a non-negative number",
      "BAD_REQUEST",
      { coefficient }
    );
    throw handlingError;
  }

  // *************** Validate: tests (optional)
  if (
    tests &&
    (!Array.isArray(tests) || tests.some((id) => !isValidObjectId(id)))
  ) {
    const handlingError = CreateAppError(
      "Tests must be an array of valid ObjectIds",
      "BAD_REQUEST",
      { tests }
    );
    throw handlingError;
  }

  // *************** Validate: subject_status
  const status = subject_status || "ACTIVE";
  if (!VALID_STATUS.includes(status)) {
    const handlingError = CreateAppError(
      "Invalid subject status",
      "BAD_REQUEST",
      {
        subject_status,
      }
    );
    throw handlingError;
  }
  const callBackPayload = {
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

  return callBackPayload;
}

/**
 * Validates and sanitizes the input object for updating a Subject entity.
 *
 * This function ensures that all required fields are provided and correctly typed,
 * optional fields are valid when present, and enum values fall within predefined lists.
 * It returns a sanitized payload ready for database update.
 *
 * @function ValidateUpdateSubject
 *
 * @param {Object} input - The input object containing subject fields to be updated.
 * @param {string} input.name - The name of the subject (required, non-empty string).
 * @param {string} input.subject_code - The unique subject code (required, non-empty string).
 * @param {string} [input.description] - Optional textual description of the subject.
 * @param {string} input.level - The level of the subject (must match one of VALID_LEVEL).
 * @param {string} [input.category] - The subject category (optional, must match VALID_CATEGORY if provided).
 * @param {string} input.block_id - The associated block ID (must be a valid MongoDB ObjectId).
 * @param {number} input.coefficient - The subject coefficient (must be a non-negative number).
 * @param {string[]} [input.tests] - Optional array of test ObjectIds (each must be valid).
 * @param {string} [input.subject_status] - Optional subject status (defaults to 'ACTIVE' if not provided).
 *
 * @returns {Object} Sanitized and validated input payload for updating a Subject document.
 *
 * @throws {AppError} If any required field is missing, contains invalid data, or if enum validations fail.
 */

function ValidateUpdateSubject(input) {
  if (typeof input !== "object" || input === null) {
    const handlingError = CreateAppError("Invalid input format", "BAD_REQUEST");
    throw handlingError;
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
    const handlingError = CreateAppError(
      "Subject name is required",
      "BAD_REQUEST",
      { name }
    );
    throw handlingError;
  }

  // *************** Validate: subject_code
  if (
    !subject_code ||
    typeof subject_code !== "string" ||
    subject_code.trim() === ""
  ) {
    const handlingError = CreateAppError(
      "Subject code is required",
      "BAD_REQUEST",
      {
        subject_code,
      }
    );
    throw handlingError;
  }

  // *************** Validate: level
  if (!VALID_LEVEL.includes(level)) {
    const handlingError = CreateAppError(
      "Invalid subject level",
      "BAD_REQUEST",
      { level }
    );
    throw handlingError;
  }

  // *************** Validate: optional category
  if (category && !VALID_CATEGORY.includes(category)) {
    const handlingError = CreateAppError(
      "Invalid subject category",
      "BAD_REQUEST",
      {
        category,
      }
    );
    throw handlingError;
  }

  // *************** Validate: block_id
  if (!block_id || !isValidObjectId(block_id)) {
    const handlingError = CreateAppError(
      "Invalid or missing block_id",
      "BAD_REQUEST",
      {
        block_id,
      }
    );
    throw handlingError;
  }

  // *************** Validate: coefficient
  if (typeof coefficient !== "number" || coefficient < 0) {
    const handlingError = CreateAppError(
      "Coefficient must be a non-negative number",
      "BAD_REQUEST",
      { coefficient }
    );
    throw handlingError;
  }

  // *************** Validate: tests (optional)
  if (
    tests &&
    (!Array.isArray(tests) || tests.some((id) => !isValidObjectId(id)))
  ) {
    const handlingError = CreateAppError(
      "Tests must be an array of valid ObjectIds",
      "BAD_REQUEST",
      { tests }
    );
    throw handlingError;
  }

  // *************** Validate: subject_status
  const status = subject_status || "ACTIVE";
  if (!VALID_STATUS.includes(status)) {
    const handlingError = CreateAppError(
      "Invalid subject status",
      "BAD_REQUEST",
      {
        subject_status,
      }
    );
    throw handlingError;
  }
  const callBackPayload = {
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
  return callBackPayload;
}

module.exports = {
  ValidateCreateSubject,
  ValidateUpdateSubject,
};

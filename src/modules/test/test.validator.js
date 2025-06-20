// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT MODULE ***************
const Test = require("./test.model");
const Task = require("../task/task.model");
const User = require("../user/user.model");

// *************** CONSTANTS ***************
const VALID_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED", "DELETED"];
const VALID_GRADING_METHOD = ["MANUAL", "AUTO_GRADED"];
const DEFAULT_GRADING_METHOD = "MANUAL";

/**
 * Validates and sanitizes input for creating a Test entity.
 *
 * Ensures that all required fields are present and correct, including nested validations
 * like notations, attachments, and subject-level weight checks. Returns a validated object
 * ready for DB insertion.
 *
 * @param {Object} input - Input object for creating a test.
 * @returns {Promise<Object>} - Validated and sanitized test payload.
 *
 * @throws {AppError} - If any field is invalid or business logic constraint fails.
 */
async function ValidateCreateTest(input) {
  if (typeof input !== "object" || input === null) {
    throw CreateAppError("Invalid input format", "BAD_REQUEST");
  }

  const {
    name,
    subject_id,
    weight,
    notations,
    grading_method,
    test_status,
    attachments,
    passing_score,
    published_date,
  } = input;

  // *************** Validate: name
  if (!name || typeof name !== "string" || name.trim() === "") {
    throw CreateAppError("Test name is required", "BAD_REQUEST", { name });
  }

  // *************** Validate: subject_id
  if (!subject_id || !isValidObjectId(subject_id)) {
    throw CreateAppError("Invalid or missing subject_id", "BAD_REQUEST", {
      subject_id,
    });
  }

  // *************** Validate: weight
  if (typeof weight !== "number" || weight < 0) {
    throw CreateAppError(
      "Weight must be a non-negative number",
      "BAD_REQUEST",
      { weight }
    );
  }

  // *************** Validate: notations
  if (!Array.isArray(notations) || notations.length === 0) {
    throw CreateAppError("Notations must be a non-empty array", "BAD_REQUEST", {
      notations,
    });
  }

  let total_score = 0;
  const sanitizedNotations = notations.map((notation, index) => {
    const { notation_text, max_points } = notation;

    if (!notation_text || typeof notation_text !== "string") {
      throw CreateAppError(
        `notation_text is required and must be a string at index ${index}`,
        "BAD_REQUEST",
        { notation_text }
      );
    }

    if (typeof max_points !== "number" || max_points < 0) {
      throw CreateAppError(
        `max_points must be a non-negative number at index ${index}`,
        "BAD_REQUEST",
        { max_points }
      );
    }

    total_score += max_points;
    const notation_response = {
      notation_text: notation_text.trim(),
      max_points,
    };
    return notation_response;
  });

  if (passing_score !== undefined) {
    if (
      typeof passing_score !== "number" ||
      passing_score < 0 ||
      passing_score > total_score
    ) {
      throw CreateAppError(
        "Passing score must be between 0 and total_score.",
        "VALIDATION_ERROR",
        { field: "passing_score" }
      );
    }
  }

  // *************** Validate: grading_method (optional)
  if (grading_method && !VALID_GRADING_METHOD.includes(grading_method)) {
    throw CreateAppError("Invalid grading method", "BAD_REQUEST", {
      grading_method,
    });
  }

  // *************** Validate: test_status
  if (!test_status || !VALID_STATUS.includes(test_status)) {
    throw CreateAppError("Invalid or missing test_status", "BAD_REQUEST", {
      test_status,
    });
  }

  // *************** Validate: attachments (optional)
  if (attachments) {
    if (!Array.isArray(attachments)) {
      throw CreateAppError(
        "Attachments must be an array of URLs",
        "BAD_REQUEST",
        { attachments }
      );
    }
  }

  // *************** Validate: published_date (optional, only for PUBLISHED status)
  if (published_date !== undefined) {
    if (isNaN(Date.parse(published_date))) {
      throw CreateAppError("Invalid published_date format", "BAD_REQUEST", {
        published_date: published_date,
      });
    }

    if (test_status !== "PUBLISHED") {
      throw CreateAppError(
        "published_date is only allowed when test_status is PUBLISHED",
        "BAD_REQUEST",
        {
          published_date: published_date,
          test_status,
        }
      );
    }
  }

  // *************** Validate: total weight per subject (including this one)
  const existingTests = await Test.find({
    subject_id,
    test_status: { $ne: "DELETED" },
  }).select("weight");

  const totalWeight =
    existingTests.reduce((sum, test) => sum + (test.weight || 0), 0) + weight;

  if (totalWeight > 1) {
    throw CreateAppError(
      `Combined test weight for subject exceeds 1. Current total would be ${totalWeight}`,
      "BAD_REQUEST",
      { subject_id, totalWeight }
    );
  }

  const callbackTestPayload = {
    name: name.trim(),
    subject_id,
    weight,
    notations: sanitizedNotations,
    total_score,
    grading_method: grading_method || "MANUAL",
    test_status,
    attachments: attachments || [],
    passing_score,
    published_date,
  };
  return callbackTestPayload;
}

/**
 * Validate and sanitize input for updating a Test entity.
 *
 * This function ensures the provided input adheres to all business logic and schema
 * requirements for a valid test update. It throws detailed validation errors using
 * `CreateAppError` if any input is invalid. On success, it returns a sanitized payload
 * that can be used directly for updating the database.
 *
 * ### Validations Performed:
 * - Checks that the input is a valid object.
 * - Validates `name` as a non-empty string.
 * - Validates `subject_id` as a valid Mongo ObjectId.
 * - Ensures `weight` is a non-negative number.
 * - Ensures `notations` is a non-empty array of valid objects.
 * - Ensures each notation has valid `notation_text` and `max_points`.
 * - Validates optional `passing_score` is between 0 and the computed `total_score`.
 * - Ensures `grading_method` is one of the allowed values (if provided).
 * - Ensures `test_status` is valid and required.
 * - Validates `attachments` as an array if present.
 * - Validates `published_date` only exists and is valid if status is `PUBLISHED`.
 * - Ensures total test weights per subject (including current update) do not exceed 1.0.
 *
 * @async
 * @function ValidateUpdateTest
 * @param {Object} input - The input object containing fields to update a Test.
 * @param {string} input.name - Name of the test.
 * @param {string} input.subject_id - MongoDB ObjectId of the subject.
 * @param {number} input.weight - Test weight, must be >= 0.
 * @param {Array<Object>} input.notations - Array of notation objects.
 * @param {string} input.notations[].notation_text - Description of the notation.
 * @param {number} input.notations[].max_points - Maximum score for the notation.
 * @param {string} [input.grading_method] - Grading method (optional).
 * @param {string} input.test_status - Test status, must be one of the allowed ENUMs.
 * @param {Array<string>} [input.attachments] - Optional list of URLs.
 * @param {number} [input.passing_score] - Optional minimum score required to pass.
 * @param {string} [input.published_date] - Optional ISO date string (only if status is `PUBLISHED`).
 *
 * @throws {AppError} Will throw an error if any validation fails.
 *
 * @returns {Promise<Object>} Sanitized and validated payload ready for update.
 * @returns {string} return.name - Trimmed test name.
 * @returns {string} return.subject_id - Original valid subject ID.
 * @returns {number} return.weight - Validated weight.
 * @returns {Array<Object>} return.notations - Cleaned list of notations.
 * @returns {number} return.total_score - Sum of all `max_points` from notations.
 * @returns {string} return.grading_method - Validated or default grading method.
 * @returns {string} return.test_status - Validated test status.
 * @returns {Array<string>} return.attachments - Validated or default attachment list.
 * @returns {number} [return.passing_score] - Validated passing score, if present.
 */

async function ValidateUpdateTest(id, input) {
  if (typeof input !== "object" || input === null) {
    throw CreateAppError("Invalid input format", "BAD_REQUEST");
  }

  const {
    name,
    subject_id,
    weight,
    notations,
    grading_method,
    test_status,
    attachments,
    passing_score,
    published_date,
  } = input;

  // *************** Validate: name
  if (!name || typeof name !== "string" || name.trim() === "") {
    throw CreateAppError("Test name is required", "BAD_REQUEST", { name });
  }

  // *************** Validate: subject_id
  if (!subject_id || !isValidObjectId(subject_id)) {
    throw CreateAppError("Invalid or missing subject_id", "BAD_REQUEST", {
      subject_id,
    });
  }

  // *************** Validate: weight
  if (typeof weight !== "number" || weight < 0) {
    throw CreateAppError(
      "Weight must be a non-negative number",
      "BAD_REQUEST",
      { weight }
    );
  }

  // *************** Validate: notations
  if (!Array.isArray(notations) || notations.length === 0) {
    throw CreateAppError("Notations must be a non-empty array", "BAD_REQUEST", {
      notations,
    });
  }

  let total_score = 0;
  const sanitizedNotations = notations.map((notation, index) => {
    const { notation_text, max_points } = notation;

    if (!notation_text || typeof notation_text !== "string") {
      throw CreateAppError(
        `notation_text is required and must be a string at index ${index}`,
        "BAD_REQUEST",
        { notation_text }
      );
    }

    if (typeof max_points !== "number" || max_points < 0) {
      throw CreateAppError(
        `max_points must be a non-negative number at index ${index}`,
        "BAD_REQUEST",
        { max_points }
      );
    }

    total_score += max_points;
    const notationPayload = {
      notation_text: notation_text.trim(),
      max_points,
    };
    return notationPayload;
  });

  if (passing_score !== undefined) {
    if (
      typeof passing_score !== "number" ||
      passing_score < 0 ||
      passing_score > total_score
    ) {
      throw CreateAppError(
        "Passing score must be between 0 and total_score.",
        "VALIDATION_ERROR",
        { field: "passing_score" }
      );
    }
  }

  // *************** Validate: grading_method (optional)
  if (grading_method && !VALID_GRADING_METHOD.includes(grading_method)) {
    throw CreateAppError("Invalid grading method", "BAD_REQUEST", {
      grading_method,
    });
  }

  // *************** Validate: test_status
  if (!test_status || !VALID_STATUS.includes(test_status)) {
    throw CreateAppError("Invalid or missing test_status", "BAD_REQUEST", {
      test_status,
    });
  }

  // *************** Validate: attachments (optional)
  if (attachments) {
    if (!Array.isArray(attachments)) {
      throw CreateAppError(
        "Attachments must be an array of URLs",
        "BAD_REQUEST",
        { attachments }
      );
    }
  }

  // *************** Validate: published_date (optional, only for PUBLISHED status)
  if (published_date !== undefined) {
    if (isNaN(Date.parse(published_date))) {
      throw CreateAppError("Invalid published_date format", "BAD_REQUEST", {
        published_date: published_date,
      });
    }

    if (test_status !== "PUBLISHED") {
      throw CreateAppError(
        "published_date is only allowed when test_status is PUBLISHED",
        "BAD_REQUEST",
        {
          published_date: published_date,
          test_status,
        }
      );
    }
  }

  // *************** Load previous weight
  const currentTest = await Test.findById(id).select("weight");
  if (!currentTest) {
    throw CreateAppError("Test not found for update", "NOT_FOUND", {
      test_id: id,
    });
  }
  // *************** Validate total weight excluding current test
  const existingTests = await Test.find({
    subject_id,
    test_status: { $ne: "DELETED" },
    _id: { $ne: id }, // exclude the current test
  }).select("weight");

  const otherWeights = existingTests.reduce(
    (sum, test) => sum + (test.weight || 0),
    0
  );

  const totalWeight = otherWeights + weight;

  if (totalWeight > 1) {
    throw CreateAppError(
      `Combined test weight for subject exceeds 1. Current total would be ${totalWeight}`,
      "BAD_REQUEST",
      {
        subject_id,
        new_weight: weight,
        current_total: totalWeight,
      }
    );
  }

  const callbackTestPayload = {
    name: name.trim(),
    subject_id,
    weight,
    notations: sanitizedNotations,
    total_score,
    grading_method: grading_method || DEFAULT_GRADING_METHOD,
    test_status,
    attachments: attachments || [],
    passing_score,
    published_date,
  };
  return callbackTestPayload;
}

/**
 * Validates assignCorrector input for publishing a test and assigning a corrector.
 *
 * @param {object} input - The input payload containing test_id, user_id, and due_date.
 * @returns {Promise<{ corrector: Object, test: Object }>}
 * @throws {AppError} If any validation fails.
 */
async function ValidateAssignCorrector(id, input) {
  const { user_id, due_date } = input;
  const errors = [];

  let corrector = null;
  let test = null;

  // *************** Validate Corrector (User)
  corrector = await User.findById(user_id);
  if (!corrector) {
    errors.push({ field: "user_id", message: "Corrector not found" });
  }

  // *************** Validate Test
  test = await Test.findById(id);
  if (!test) {
    errors.push({ field: "id", message: "Test not found" });
  } else if (test.test_status !== "DRAFT") {
    errors.push({
      field: "test_status",
      message: "Test must be in DRAFT status to be published",
    });
  }

  // *************** Validate Due Date (Optional, but must be a valid future date if provided)
  if (due_date) {
    const parsedDate = new Date(due_date);
    if (isNaN(parsedDate.getTime())) {
      errors.push({
        field: "due_date",
        message: "Due date must be a valid date",
      });
    } else if (parsedDate < new Date()) {
      errors.push({
        field: "due_date",
        message: "Due date must be in the future",
      });
    }
  }

  // *************** Throw if any errors found
  if (errors.length > 0) {
    throw CreateAppError("Validation failed", "BAD_USER_INPUT", { errors });
  }

  const callbackAssignCorrectorPayload = { corrector, due_date };
  return callbackAssignCorrectorPayload;
}

module.exports = {
  ValidateCreateTest,
  ValidateUpdateTest,
  ValidateAssignCorrector,
};

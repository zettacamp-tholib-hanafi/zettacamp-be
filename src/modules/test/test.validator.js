// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT MODULE ***************
const TestModel = require("../test/test.model");

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
    return {
      notation_text: notation_text.trim(),
      max_points,
    };
  });

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
  if (input.published_date !== undefined) {
    if (isNaN(Date.parse(input.published_date))) {
      throw CreateAppError("Invalid published_date format", "BAD_REQUEST", {
        published_date: input.published_date,
      });
    }

    if (test_status !== "PUBLISHED") {
      throw CreateAppError(
        "published_date is only allowed when test_status is PUBLISHED",
        "BAD_REQUEST",
        {
          published_date: input.published_date,
          test_status,
        }
      );
    }
  }

  // *************** Validate: total weight per subject (including this one)
  const existingTests = await TestModel.find({
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

  return {
    name: name.trim(),
    subject_id,
    weight,
    notations: sanitizedNotations,
    total_score,
    grading_method: grading_method || "MANUAL",
    test_status,
    attachments: attachments || [],
  };
}

async function ValidateUpdateTest(input) {
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
    return {
      notation_text: notation_text.trim(),
      max_points,
    };
  });

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
  if (input.published_date !== undefined) {
    if (isNaN(Date.parse(input.published_date))) {
      throw CreateAppError("Invalid published_date format", "BAD_REQUEST", {
        published_date: input.published_date,
      });
    }

    if (test_status !== "PUBLISHED") {
      throw CreateAppError(
        "published_date is only allowed when test_status is PUBLISHED",
        "BAD_REQUEST",
        {
          published_date: input.published_date,
          test_status,
        }
      );
    }
  }

  // *************** Validate: total weight per subject (including this one)
  const existingTests = await TestModel.find({
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

  return {
    name: name.trim(),
    subject_id,
    weight,
    notations: sanitizedNotations,
    total_score,
    grading_method: grading_method || DEFAULT_GRADING_METHOD,
    test_status,
    attachments: attachments || [],
  };
}
module.exports = {
  ValidateCreateTest,
  ValidateUpdateTest,
};

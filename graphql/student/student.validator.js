// *************** IMPORT UTILITIES ***************
const { createAppError } = require("../../utils/ErrorFormat.js");

/**
 * Validate input payload for creating a student.
 *
 * @param {Object} input - Student input object.
 */
function validateCreateStudentInput(input) {
  const { first_name, last_name, email, date_of_birth, school_id } = input;

  if (!first_name || typeof first_name !== "string") {
    throw createAppError(
      "First name is required and must be a string.",
      "VALIDATION_ERROR",
      {
        field: "first_name",
      }
    );
  }

  if (!last_name || typeof last_name !== "string") {
    throw createAppError(
      "Last name is required and must be a string.",
      "VALIDATION_ERROR",
      {
        field: "last_name",
      }
    );
  }

  if (!email || typeof email !== "string") {
    throw createAppError(
      "Email is required and must be a string.",
      "VALIDATION_ERROR",
      {
        field: "email",
      }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createAppError("Email format is invalid.", "VALIDATION_ERROR", {
      field: "email",
    });
  }

  if (!date_of_birth || isNaN(new Date(date_of_birth).getTime())) {
    throw createAppError(
      "Date of birth is required and must be a valid date.",
      "VALIDATION_ERROR",
      {
        field: "date_of_birth",
      }
    );
  }

  if (!school_id || typeof school_id !== "string") {
    throw createAppError(
      "School ID is required and must be a string.",
      "VALIDATION_ERROR",
      {
        field: "school_id",
      }
    );
  }
}

/**
 * Validate input payload for updating a student.
 *
 * @param {Object} input - Partial student input object.
 */
function validateUpdateStudentInput(input) {
  const { first_name, last_name, email, date_of_birth, school_id } = input;

  if (first_name && typeof first_name !== "string") {
    throw createAppError("First name must be a string.", "VALIDATION_ERROR", {
      field: "first_name",
    });
  }

  if (last_name && typeof last_name !== "string") {
    throw createAppError("Last name must be a string.", "VALIDATION_ERROR", {
      field: "last_name",
    });
  }

  if (email) {
    if (typeof email !== "string") {
      throw createAppError("Email must be a string.", "VALIDATION_ERROR", {
        field: "email",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createAppError("Email format is invalid.", "VALIDATION_ERROR", {
        field: "email",
      });
    }
  }

  if (date_of_birth && isNaN(new Date(date_of_birth).getTime())) {
    throw createAppError(
      "Date of birth must be a valid date.",
      "VALIDATION_ERROR",
      {
        field: "date_of_birth",
      }
    );
  }

  if (school_id && typeof school_id !== "string") {
    throw createAppError("School ID must be a string.", "VALIDATION_ERROR", {
      field: "school_id",
    });
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  validateCreateStudentInput,
  validateUpdateStudentInput,
};
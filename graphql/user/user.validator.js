// *************** IMPORT HELPER FUNCTION ***************
const { createAppError } = require("../../utils/error.helper.js");

// *************** Constant
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate input payload for creating a user.
 * Throws an error if any required field is missing or invalid.
 *
 * @param {Object} input - User input object.
 * @param {string} input.first_name - First name of the user.
 * @param {string} input.last_name - Last name of the user.
 * @param {string} input.email - Email of the user.
 * @param {string} input.password - Password of the user.
 * @param {string} input.role - Role of the user.
 */
function validateCreateUserInput(input) {
  const { first_name, last_name, email, password, role } = input;

  if (typeof first_name !== "string" || !first_name.trim()) {
    throw createAppError(
      "First name is required and must be a non-empty string.",
      "VALIDATION_ERROR",
      { field: "first_name" }
    );
  }

  if (typeof last_name !== "string" || !last_name.trim()) {
    throw createAppError(
      "Last name is required and must be a non-empty string.",
      "VALIDATION_ERROR",
      { field: "last_name" }
    );
  }

  if (typeof email !== "string" || !email.trim()) {
    throw createAppError(
      "Email is required and must be a non-empty string.",
      "VALIDATION_ERROR",
      { field: "email" }
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    throw createAppError("Email format is invalid.", "VALIDATION_ERROR", {
      field: "email",
    });
  }

  if (typeof password !== "string" || !password.trim()) {
    throw createAppError(
      "Password is required and must be a non-empty string.",
      "VALIDATION_ERROR",
      { field: "password" }
    );
  }

  if (password.length < 8) {
    throw createAppError(
      "Password must be at least 8 characters long.",
      "VALIDATION_ERROR",
      { field: "password" }
    );
  }

  if (typeof role !== "string" || !role.trim()) {
    throw createAppError(
      "Role is required and must be a non-empty string.",
      "VALIDATION_ERROR",
      { field: "role" }
    );
  }
}

/**
 * Validate input payload for updating a user.
 * Throws an error if any provided field is invalid.
 *
 * @param {Object} input - Partial user input object.
 * @param {string} [input.first_name] - New first name.
 * @param {string} [input.last_name] - New last name.
 * @param {string} [input.email] - New email address.
 * @param {string} [input.role] - New user role.
 */
function validateUpdateUserInput(input) {
  const { first_name, last_name, email, role } = input;

  if (first_name !== undefined) {
    if (typeof first_name !== "string" || !first_name.trim()) {
      throw createAppError(
        "First name must be a non-empty string.",
        "VALIDATION_ERROR",
        {
          field: "first_name",
        }
      );
    }
  }

  if (last_name !== undefined) {
    if (typeof last_name !== "string" || !last_name.trim()) {
      throw createAppError(
        "Last name must be a non-empty string.",
        "VALIDATION_ERROR",
        {
          field: "last_name",
        }
      );
    }
  }

  if (email !== undefined) {
    if (typeof email !== "string" || !email.trim()) {
      throw createAppError(
        "Email must be a non-empty string.",
        "VALIDATION_ERROR",
        {
          field: "email",
        }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      throw createAppError("Email format is invalid.", "VALIDATION_ERROR", {
        field: "email",
      });
    }
  }

  if (role !== undefined) {
    if (typeof role !== "string" || !role.trim()) {
      throw createAppError(
        "Role must be a non-empty string.",
        "VALIDATION_ERROR",
        {
          field: "role",
        }
      );
    }
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  validateCreateUserInput,
  validateUpdateUserInput,
};

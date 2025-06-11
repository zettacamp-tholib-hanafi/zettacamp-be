// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error.js");

// *************** Constant Regex & Enum

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+\..+/;
const VALID_ROLES = ["ACADEMIC_DIRECTOR", "ACADEMIC_ADMIN", "CORRECTOR"];
const VALID_STATUSES = ["ACTIVE", "PENDING"];
const VALID_DEPARTMENTS = ["ACADEMIC", "ADMISSIONS"];

/**
 * Validate input payload for creating a user.
 *
 * @param {Object} input - User input object.
 * @throws {AppError} If any validation fails.
 */
function ValidateCreateUserInput(input) {
  const {
    first_name,
    last_name,
    email,
    password,
    role,
    user_status,
    phone,
    profile_picture_url,
    department,
    preferences,
  } = input;

  // *************** Basic required string fields
  if (typeof first_name !== "string" || !first_name.trim()) {
    throw CreateAppError("First name is required.", "VALIDATION_ERROR", {
      field: "first_name",
    });
  }

  if (typeof last_name !== "string" || !last_name.trim()) {
    throw CreateAppError("Last name is required.", "VALIDATION_ERROR", {
      field: "last_name",
    });
  }

  if (typeof email !== "string" || !email.trim() || !EMAIL_REGEX.test(email)) {
    throw CreateAppError("Email is invalid.", "VALIDATION_ERROR", {
      field: "email",
    });
  }

  if (typeof password !== "string" || password.length < 8) {
    throw CreateAppError(
      "Password must be at least 8 characters long.",
      "VALIDATION_ERROR",
      { field: "password" }
    );
  }
  const invalidRoles = input.role.filter((role) => !VALID_ROLES.includes(role));
  if (invalidRoles.length > 0) {
    throw CreateAppError("Invalid role value.", "VALIDATION_ERROR", {
      field: "role",
      invalidValues: invalidRoles,
    });
  }

  // *************** Optional / enum validation
  if (user_status && !VALID_STATUSES.includes(user_status)) {
    throw CreateAppError("Invalid user_status value.", "VALIDATION_ERROR", {
      field: "user_status",
    });
  }

  if (phone && (typeof phone !== "string" || !phone.trim())) {
    throw CreateAppError("Phone must be a valid string.", "VALIDATION_ERROR", {
      field: "phone",
    });
  }

  if (
    profile_picture_url &&
    (typeof profile_picture_url !== "string" ||
      !URL_REGEX.test(profile_picture_url))
  ) {
    throw CreateAppError(
      "Invalid profile_picture_url format.",
      "VALIDATION_ERROR",
      {
        field: "profile_picture_url",
      }
    );
  }

  if (department && !VALID_DEPARTMENTS.includes(department)) {
    throw CreateAppError("Invalid department.", "VALIDATION_ERROR", {
      field: "department",
    });
  }

  if (preferences) {
    if (preferences.language && typeof preferences.language !== "string") {
      throw CreateAppError("Invalid preferences.language", "VALIDATION_ERROR", {
        field: "preferences.language",
      });
    }
    if (preferences.timezone && typeof preferences.timezone !== "string") {
      throw CreateAppError("Invalid preferences.timezone", "VALIDATION_ERROR", {
        field: "preferences.timezone",
      });
    }
  }
}

/**
 * Validate input payload for updating a user.
 *
 * @param {Object} input - Partial user input object.
 * @throws {AppError} If any validation fails.
 */
function ValidateUpdateUserInput(input) {
  const {
    first_name,
    last_name,
    email,
    password,
    role,
    user_status,
    phone,
    profile_picture_url,
    department,
    preferences,
  } = input;

  if (first_name !== undefined) {
    if (typeof first_name !== "string" || !first_name.trim()) {
      throw CreateAppError(
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
      throw CreateAppError(
        "Last name must be a non-empty string.",
        "VALIDATION_ERROR",
        {
          field: "last_name",
        }
      );
    }
  }

  if (email !== undefined) {
    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      throw CreateAppError("Email is invalid.", "VALIDATION_ERROR", {
        field: "email",
      });
    }
  }

  if (password !== undefined) {
    if (typeof password !== "string" || password.length < 8) {
      throw CreateAppError(
        "Password must be at least 8 characters long.",
        "VALIDATION_ERROR",
        {
          field: "password",
        }
      );
    }
  }

  if (role !== undefined) {
    if (!Array.isArray(role) || role.length === 0) {
      throw CreateAppError(
        "Role must be a non-empty array.",
        "VALIDATION_ERROR",
        {
          field: "role",
        }
      );
    }

    const invalidRoles = role.filter((r) => !VALID_ROLES.includes(r));
    if (invalidRoles.length > 0) {
      throw CreateAppError("Invalid role value.", "VALIDATION_ERROR", {
        field: "role",
        invalidValues: invalidRoles,
      });
    }
  }

  if (user_status !== undefined && !VALID_STATUSES.includes(user_status)) {
    throw CreateAppError("Invalid user_status value.", "VALIDATION_ERROR", {
      field: "user_status",
    });
  }

  if (phone !== undefined && (typeof phone !== "string" || !phone.trim())) {
    throw CreateAppError("Phone must be a valid string.", "VALIDATION_ERROR", {
      field: "phone",
    });
  }

  if (
    profile_picture_url !== undefined &&
    (typeof profile_picture_url !== "string" ||
      !/^https?:\/\/.+\..+/.test(profile_picture_url))
  ) {
    throw CreateAppError(
      "Invalid profile_picture_url format.",
      "VALIDATION_ERROR",
      {
        field: "profile_picture_url",
      }
    );
  }

  if (department !== undefined && !VALID_DEPARTMENTS.includes(department)) {
    throw CreateAppError("Invalid department.", "VALIDATION_ERROR", {
      field: "department",
    });
  }

  if (preferences !== undefined) {
    if (preferences.language && typeof preferences.language !== "string") {
      throw CreateAppError("Invalid preferences.language", "VALIDATION_ERROR", {
        field: "preferences.language",
      });
    }
    if (preferences.timezone && typeof preferences.timezone !== "string") {
      throw CreateAppError("Invalid preferences.timezone", "VALIDATION_ERROR", {
        field: "preferences.timezone",
      });
    }
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateCreateUserInput,
  ValidateUpdateUserInput,
};

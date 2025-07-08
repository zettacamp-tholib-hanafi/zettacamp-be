// *************** IMPORT LIBRARY ***************
const bcrypt = require("bcrypt");

// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error.js");

// *************** IMPORT MODULE ***************
const User = require("./user.model.js");

// *************** IMPORT UTILITIES ***************
const { USER } = require("../../shared/utils/enum.js");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+\..+/;

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
  const invalidRoles = input.role.filter(
    (role) => !USER.VALID_ROLE.includes(role)
  );
  if (invalidRoles.length > 0) {
    throw CreateAppError("Invalid role value.", "VALIDATION_ERROR", {
      field: "role",
      invalidValues: invalidRoles,
    });
  }

  // *************** Optional / enum validation
  if (user_status && !USER.VALID_STATUS.includes(user_status)) {
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

  if (department && !USER.VALID_DEPARTEMENT.includes(department)) {
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

    const invalidRoles = role.filter((role) => !USER.VALID_ROLE.includes(role));
    if (invalidRoles.length > 0) {
      throw CreateAppError("Invalid role value.", "VALIDATION_ERROR", {
        field: "role",
        invalidValues: invalidRoles,
      });
    }
  }

  if (user_status !== undefined && !USER.VALID_STATUS.includes(user_status)) {
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

  if (
    department !== undefined &&
    !USER.VALID_DEPARTEMENT.includes(department)
  ) {
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

/**
 * Validate user login credentials (email and password).
 *
 * This function performs a full login validation flow:
 * - Validates email format using regex.
 * - Ensures password is not empty or blank.
 * - Finds user by email (excluding those with status "DELETED").
 * - Verifies the password using bcrypt.
 *
 * If validation succeeds, the user document is returned.
 * Otherwise, appropriate application-level errors are thrown.
 *
 * @async
 * @function ValidateLoginInput
 * @param {string} email - The email address provided by the user.
 * @param {string} password - The plain-text password provided by the user.
 * @throws {AppError} If email format is invalid.
 * @throws {AppError} If password is empty or blank.
 * @throws {AppError} If user is not found or is marked as deleted.
 * @throws {AppError} If the password does not match the stored hash.
 * @returns {Promise<Object>} The authenticated user document from the database.
 */

async function ValidateLoginInput(email, password) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw CreateAppError("Invalid email format", "BAD_REQUEST", {
      field: "email",
    });
  }

  if (!password || password.trim() === "") {
    throw CreateAppError("Invalid password format", "BAD_REQUEST", {
      field: "password",
    });
  }

  const user = await User.findOne({
    email,
    user_status: {
      $ne: "DELETED",
    },
  });
  if (!user) {
    throw CreateAppError("Invalid credentials", "UNAUTHORIZED");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw CreateAppError("Invalid credentials", "UNAUTHORIZED");
  }

  return user;
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateCreateUserInput,
  ValidateUpdateUserInput,
  ValidateLoginInput,
};

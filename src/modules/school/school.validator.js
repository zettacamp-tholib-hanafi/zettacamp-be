// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error.js");

// ************** IMPORT UTILITIES *************
const { SCHOOL } = require("../../shared/utils/enum.js");

// *************** Constant
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;

/**
 * Validates the address object to ensure all required fields are present and are strings.
 *
 * @param {object} address - The address object to validate.
 * @throws {AppError} If the address is missing, not an object, or contains invalid/missing fields.
 */

function ValidateAddress(address) {
  const requiredFields = [
    "street_name",
    "street_number",
    "city",
    "state",
    "postal_code",
    "country",
    "address_line1",
  ];

  if (!address || typeof address !== "object") {
    throw CreateAppError(
      "Address is required and must be an object.",
      "VALIDATION_ERROR",
      { field: "address" }
    );
  }

  requiredFields.forEach((field) => {
    if (!address[field] || typeof address[field] !== "string") {
      throw CreateAppError(
        `Address.${field} is required and must be a string.`,
        "VALIDATION_ERROR",
        { field: `address.${field}` }
      );
    }
  });

  if (address.address_line2 && typeof address.address_line2 !== "string") {
    throw CreateAppError(
      "Address.address_line2 must be a string.",
      "VALIDATION_ERROR",
      { field: "address.address_line2" }
    );
  }
}

/**
 * Validates the contact object fields like phone, email, and website.
 *
 * @param {object} contact - The contact object to validate.
 * @throws {AppError} If the contact fields are invalid or in incorrect format.
 */

function ValidateContact(contact) {
  if (!contact || typeof contact !== "object") {
    throw CreateAppError(
      "Contact must be a valid object.",
      "VALIDATION_ERROR",
      { field: "contact" }
    );
  }

  if (contact.phone && !PHONE_REGEX.test(contact.phone + "")) {
    throw CreateAppError(
      "Contact phone must be a valid phone number.",
      "VALIDATION_ERROR",
      { field: "contact.phone" }
    );
  }

  if (contact.email) {
    if (typeof contact.email !== "string") {
      throw CreateAppError(
        "Contact email must be a string.",
        "VALIDATION_ERROR",
        { field: "contact.email" }
      );
    }
    if (!EMAIL_REGEX.test(contact.email)) {
      throw CreateAppError(
        "Contact email must be in a valid format.",
        "VALIDATION_ERROR",
        { field: "contact.email" }
      );
    }
  }

  if (contact.website && !URL_REGEX.test(contact.website)) {
    throw CreateAppError(
      "Contact website must be a valid URL.",
      "VALIDATION_ERROR",
      { field: "contact.website" }
    );
  }
}

/**
 * Validates the verified array to ensure each verified has a boolean `status_verified`
 * and an optional string `verified_by` field.
 *
 * @param {Array<object>} verified - The array of verification objects to validate.
 * @throws {AppError} If the input is not a non-empty array or contains invalid fields.
 */

function ValidateVerified(verified) {
  if (!Array.isArray(verified) || verified.length === 0) {
    throw CreateAppError(
      "Verified is required and must be a non-empty array.",
      "VALIDATION_ERROR",
      { field: "verified" }
    );
  }

  verified.forEach((verified, index) => {
    if (typeof verified.status_verified !== "boolean") {
      throw CreateAppError(
        "Each verified.status_verified must be a boolean.",
        "VALIDATION_ERROR",
        { field: `verified[${index}].status_verified` }
      );
    }

    if (verified.verified_by && typeof verified.verified_by !== "string") {
      throw CreateAppError(
        "Each verified.verified_by must be a string.",
        "VALIDATION_ERROR",
        { field: `verified[${index}].verified_by` }
      );
    }
  });
}

/**
 * Validates the admin user array, checking that each object contains valid fields.
 *
 * @param {Array<object>} adminUsers - The array of admin user objects to validate.
 * @throws {AppError} If any admin user field has an invalid format or type.
 */

function ValidateAdminUser(adminUsers) {
  if (!Array.isArray(adminUsers)) {
    throw CreateAppError("Admin users must be an array.", "VALIDATION_ERROR", {
      field: "admin_user",
    });
  }

  adminUsers.forEach((admin, index) => {
    if (admin.id && !isValidObjectId(admin.id)) {
      throw CreateAppError(
        "Each admin_user.id must be a valid ObjectId.",
        "VALIDATION_ERROR",
        { field: `admin_user[${index}].id` }
      );
    }

    if (admin.role && typeof admin.role !== "string") {
      throw CreateAppError(
        "Each admin_user.role must be a string.",
        "VALIDATION_ERROR",
        { field: `admin_user[${index}].role` }
      );
    }

    if (admin.assigned_at && typeof admin.assigned_at !== "string") {
      throw CreateAppError(
        "Each admin_user.assigned_at must be a string.",
        "VALIDATION_ERROR",
        { field: `admin_user[${index}].assigned_at` }
      );
    }
  });
}

/**
 * Validates input payload for creating a school.
 *
 * @param {object} input - The input object for school creation.
 * @param {string} input.short_name - Required short name of the school.
 * @param {string} input.long_name - Required long name of the school.
 * @param {string} [input.logo_url] - Optional logo URL of the school.
 * @param {string} input.school_status - Status of the school: PENDING, ACTIVE, or DELETED.
 * @param {string} input.created_by - User ID of the creator.
 * @param {string} input.updated_by - User ID of the updater.
 * @throws {AppError} If any required field is missing or has an invalid format.
 */

function ValidateCreateSchoolInput(input) {
  const {
    short_name,
    long_name,
    logo_url,
    school_status,
    created_by,
    updated_by,
  } = input;

  if (!short_name || typeof short_name !== "string") {
    throw CreateAppError(
      "Short name is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "short_name" }
    );
  }

  if (!long_name || typeof long_name !== "string") {
    throw CreateAppError(
      "Long name is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "long_name" }
    );
  }

  if (logo_url && !URL_REGEX.test(logo_url)) {
    throw CreateAppError("Logo URL must be a valid URL.", "VALIDATION_ERROR", {
      field: "logo_url",
    });
  }

  if (!school_status || !SCHOOL.VALID_STATUS.includes(school_status)) {
    throw CreateAppError(
      "School status is required and must be one of: PENDING, ACTIVE.",
      "VALIDATION_ERROR",
      { field: "school_status" }
    );
  }

  if (!created_by || typeof created_by !== "string") {
    throw CreateAppError(
      "Created_by is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "created_by" }
    );
  }

  if (!updated_by || typeof updated_by !== "string") {
    throw CreateAppError(
      "Updated_by is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "updated_by" }
    );
  }
}

/**
 * Validates input payload for updating a school.
 *
 * @param {object} input - The input object for school update.
 * @param {string} [input.short_name] - Optional short name of the school.
 * @param {string} [input.long_name] - Optional long name of the school.
 * @param {string} [input.logo_url] - Optional logo URL of the school.
 * @param {string} [input.school_status] - Optional status of the school: PENDING, ACTIVE, or DELETED.
 * @param {string} [input.created_by] - Optional ID of the user who originally created the record.
 * @param {string} [input.updated_by] - Optional ID of the user performing the update.
 * @throws {AppError} If any provided field has an invalid format.
 */

function ValidateUpdateSchoolInput(input) {
  const {
    short_name,
    long_name,
    logo_url,
    school_status,
    created_by,
    updated_by,
  } = input;

  if (short_name && typeof short_name !== "string") {
    throw CreateAppError("Short name must be a string.", "VALIDATION_ERROR", {
      field: "short_name",
    });
  }

  if (long_name && typeof long_name !== "string") {
    throw CreateAppError("Long name must be a string.", "VALIDATION_ERROR", {
      field: "long_name",
    });
  }

  if (logo_url && !URL_REGEX.test(logo_url)) {
    throw CreateAppError("Logo URL must be a valid URL.", "VALIDATION_ERROR", {
      field: "logo_url",
    });
  }

  if (school_status && !SCHOOL.VALID_STATUS.includes(school_status)) {
    throw CreateAppError(
      "School status must be one of: PENDING, ACTIVE.",
      "VALIDATION_ERROR",
      { field: "school_status" }
    );
  }

  if (created_by && typeof created_by !== "string") {
    throw CreateAppError("Created_by must be a string.", "VALIDATION_ERROR", {
      field: "created_by",
    });
  }

  if (updated_by && typeof updated_by !== "string") {
    throw CreateAppError("Updated_by must be a string.", "VALIDATION_ERROR", {
      field: "updated_by",
    });
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateCreateSchoolInput,
  ValidateUpdateSchoolInput,
  ValidateAddress,
  ValidateContact,
  ValidateVerified,
  ValidateAdminUser,
};

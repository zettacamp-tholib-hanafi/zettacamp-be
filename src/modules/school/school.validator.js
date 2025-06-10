// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT UTILITIES ***************
const { createAppError } = require("../../core/error.js");

// *************** REGEX VALIDATORS ***************
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;

/**
 * Validate address input.
 */
function validateAddress(address) {
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
    throw createAppError(
      "Address is required and must be an object.",
      "VALIDATION_ERROR",
      { field: "address" }
    );
  }

  requiredFields.forEach((field) => {
    if (!address[field] || typeof address[field] !== "string") {
      throw createAppError(
        `Address.${field} is required and must be a string.`,
        "VALIDATION_ERROR",
        { field: `address.${field}` }
      );
    }
  });

  if (address.address_line2 && typeof address.address_line2 !== "string") {
    throw createAppError(
      "Address.address_line2 must be a string.",
      "VALIDATION_ERROR",
      { field: "address.address_line2" }
    );
  }
}

/**
 * Validate contact input.
 */
function validateContact(contact) {
  if (!contact || typeof contact !== "object") return;

  if (contact.phone && !PHONE_REGEX.test(contact.phone + "")) {
    throw createAppError(
      "Contact phone must be a valid phone number.",
      "VALIDATION_ERROR",
      { field: "contact.phone" }
    );
  }

  if (contact.email) {
    if (typeof contact.email !== "string") {
      throw createAppError(
        "Contact email must be a string.",
        "VALIDATION_ERROR",
        { field: "contact.email" }
      );
    }
    if (!EMAIL_REGEX.test(contact.email)) {
      throw createAppError(
        "Contact email must be in a valid format.",
        "VALIDATION_ERROR",
        { field: "contact.email" }
      );
    }
  }

  if (contact.website && !URL_REGEX.test(contact.website)) {
    throw createAppError(
      "Contact website must be a valid URL.",
      "VALIDATION_ERROR",
      { field: "contact.website" }
    );
  }
}

/**
 * Validate verified info array.
 */
function validateVerified(verified) {
  if (!Array.isArray(verified) || verified.length === 0) {
    throw createAppError(
      "Verified is required and must be a non-empty array.",
      "VALIDATION_ERROR",
      { field: "verified" }
    );
  }

  verified.forEach((item, index) => {
    if (typeof item.status_verified !== "boolean") {
      throw createAppError(
        "Each verified.status_verified must be a boolean.",
        "VALIDATION_ERROR",
        { field: `verified[${index}].status_verified` }
      );
    }

    if (item.verified_by && typeof item.verified_by !== "string") {
      throw createAppError(
        "Each verified.verified_by must be a string.",
        "VALIDATION_ERROR",
        { field: `verified[${index}].verified_by` }
      );
    }
  });
}

/**
 * Validate admin_user array.
 */
function validateAdminUser(adminUsers) {
  if (!Array.isArray(adminUsers)) return;

  adminUsers.forEach((admin, index) => {
    if (admin.id && !isValidObjectId(admin.id)) {
      throw createAppError(
        "Each admin_user.id must be a valid ObjectId.",
        "VALIDATION_ERROR",
        { field: `admin_user[${index}].id` }
      );
    }

    if (admin.role && typeof admin.role !== "string") {
      throw createAppError(
        "Each admin_user.role must be a string.",
        "VALIDATION_ERROR",
        { field: `admin_user[${index}].role` }
      );
    }

    if (admin.assigned_at && typeof admin.assigned_at !== "string") {
      throw createAppError(
        "Each admin_user.assigned_at must be a string.",
        "VALIDATION_ERROR",
        { field: `admin_user[${index}].assigned_at` }
      );
    }
  });
}

/**
 * Validate input payload for creating a school.
 */
function validateCreateSchoolInput(input) {
  const {
    short_name,
    long_name,
    logo_url,
    school_status,
    created_by,
    updated_by,
  } = input;

  if (!short_name || typeof short_name !== "string") {
    throw createAppError(
      "Short name is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "short_name" }
    );
  }

  if (!long_name || typeof long_name !== "string") {
    throw createAppError(
      "Long name is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "long_name" }
    );
  }

  if (logo_url && !URL_REGEX.test(logo_url)) {
    throw createAppError("Logo URL must be a valid URL.", "VALIDATION_ERROR", {
      field: "logo_url",
    });
  }

  if (
    !school_status ||
    !["PENDING", "ACTIVE", "DELETED"].includes(school_status)
  ) {
    throw createAppError(
      "School status is required and must be one of: PENDING, ACTIVE, DELETED.",
      "VALIDATION_ERROR",
      { field: "school_status" }
    );
  }

  if (!created_by || typeof created_by !== "string") {
    throw createAppError(
      "Created_by is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "created_by" }
    );
  }

  if (!updated_by || typeof updated_by !== "string") {
    throw createAppError(
      "Updated_by is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "updated_by" }
    );
  }
}

/**
 * Validate input payload for updating a school.
 */
function validateUpdateSchoolInput(input) {
  const {
    short_name,
    long_name,
    logo_url,
    school_status,
    created_by,
    updated_by,
  } = input;

  if (short_name && typeof short_name !== "string") {
    throw createAppError("Short name must be a string.", "VALIDATION_ERROR", {
      field: "short_name",
    });
  }

  if (long_name && typeof long_name !== "string") {
    throw createAppError("Long name must be a string.", "VALIDATION_ERROR", {
      field: "long_name",
    });
  }

  if (logo_url && !URL_REGEX.test(logo_url)) {
    throw createAppError("Logo URL must be a valid URL.", "VALIDATION_ERROR", {
      field: "logo_url",
    });
  }

  if (
    school_status &&
    !["PENDING", "ACTIVE", "DELETED"].includes(school_status)
  ) {
    throw createAppError(
      "School status must be one of: PENDING, ACTIVE, DELETED.",
      "VALIDATION_ERROR",
      { field: "school_status" }
    );
  }

  if (created_by && typeof created_by !== "string") {
    throw createAppError("Created_by must be a string.", "VALIDATION_ERROR", {
      field: "created_by",
    });
  }

  if (updated_by && typeof updated_by !== "string") {
    throw createAppError("Updated_by must be a string.", "VALIDATION_ERROR", {
      field: "updated_by",
    });
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  validateCreateSchoolInput,
  validateUpdateSchoolInput,
  validateAddress,
  validateContact,
  validateVerified,
  validateAdminUser,
};

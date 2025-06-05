// *************** IMPORT UTILITIES ***************
const { createAppError } = require("../../utils/ErrorFormat.js");

/**
 * Validate input payload for creating a school.
 *
 * @param {Object} input - School input object.
 * @param {string} input.name - Required school name.
 * @param {string} [input.address] - Optional school address.
 */
function validateCreateSchoolInput(input) {
  const { name, address } = input;

  if (!name || typeof name !== "string") {
    throw createAppError(
      "Name is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "name" }
    );
  }

  if (address && typeof address !== "string") {
    throw createAppError("Address must be a string.", "VALIDATION_ERROR", {
      field: "address",
    });
  }
}

/**
 * Validate input payload for updating a school.
 *
 * @param {Object} input - School update input object.
 * @param {string} [input.name] - Optional new name.
 * @param {string} [input.address] - Optional new address.
 */
function validateUpdateSchoolInput(input) {
  const { name, address } = input;

  if (name && typeof name !== "string") {
    throw createAppError("Name must be a string.", "VALIDATION_ERROR", {
      field: "name",
    });
  }

  if (address && typeof address !== "string") {
    throw createAppError("Address must be a string.", "VALIDATION_ERROR", {
      field: "address",
    });
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  validateCreateSchoolInput,
  validateUpdateSchoolInput,
};

// *************** IMPORT MODULE ***************
const mongoose = require("mongoose");
const { CreateAppError } = require("../../core/error.js");
/**
 * Validate and sanitize a MongoDB ObjectId.
 *
 * @param {any} rawId - The raw input to validate as a MongoDB ID.
 * @param {string} [label="ID"] - Label used in error messages for clarity.
 * @returns {string} The validated ID string.
 * @throws {Error} Throws standardized AppError if validation fails.
 */
async function ValidateMongoId(rawId, label = "ID") {
  // *************** Step 1: Ensure value is present
  if (
    rawId === undefined ||
    rawId === null ||
    rawId === "" ||
    rawId === "null" ||
    rawId === "undefined" ||
    !rawId.trim()
  ) {
    throw CreateAppError(`${label} is required`, "VALIDATION_ERROR", {
      field: label,
    });
  }

  // *************** Step 2: Ensure it's a string
  if (typeof rawId !== "string") {
    throw CreateAppError(`${label} must be a string`, "VALIDATION_ERROR", {
      field: label,
      value: rawId,
    });
  }

  // *************** Step 3: Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    throw CreateAppError(`Invalid ${label} format`, "VALIDATION_ERROR", {
      field: label,
      value: rawId,
    });
  }

  return rawId;
}

// *************** EXPORT MODULE ***************
module.exports = { ValidateMongoId };

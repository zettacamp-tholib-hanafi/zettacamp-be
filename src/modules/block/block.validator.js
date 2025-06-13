// *************** IMPORT HELPER ***************
const createAppError = require("../../shared/helpers/createAppError");
const mongoose = require("mongoose");

const VALID_STATUSES = ["ACTIVE", "ARCHIVED", "DELETED"];

/**
 * Validate input for creating a new Block.
 *
 * Required fields: name, block_status (enum), start_date.
 * - block_status must be one of: ACTIVE, ARCHIVED, DELETED.
 * - start_date and end_date must be valid dates.
 * - If subjects is provided, it must be an array of valid MongoDB ObjectIds.
 *
 * @param {Object} input - The input object from CreateBlock mutation.
 * @returns {Object} Validated and sanitized payload.
 * @throws {AppError} If any validation fails.
 */
function ValidateCreateBlock(input) {
  const errors = [];

  // *************** Extract fields
  const { name, description, block_status, start_date, end_date, subjects } =
    input;

  // *************** Validate required fields

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("Field 'name' is required and must be a non-empty string.");
  }

  if (!block_status || !VALID_STATUSES.includes(block_status)) {
    errors.push(
      `Field 'block_status' is required"
      )}.`
    );
  }

  const startDateObj = new Date(start_date);
  if (!start_date || isNaN(startDateObj.getTime())) {
    errors.push("Field 'start_date' is required and must be a valid date.");
  }

  // *************** Optional field validation

  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      errors.push("Field 'description' must be a string if provided.");
    }
  }

  let endDateObj = null;
  if (end_date) {
    endDateObj = new Date(end_date);
    if (isNaN(endDateObj.getTime())) {
      errors.push("Field 'end_date' must be a valid date if provided.");
    } else if (!isNaN(startDateObj.getTime()) && endDateObj <= startDateObj) {
      errors.push("Field 'end_date' must be after 'start_date'.");
    }
  }

  if (subjects !== undefined) {
    if (!Array.isArray(subjects)) {
      errors.push("Field 'subjects' must be an array if provided.");
    } else {
      for (const id of subjects) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push(`Invalid subject ID: ${id}`);
          break;
        }
      }
    }
  }

  // *************** Throw if validation failed
  if (errors.length > 0) {
    throw createAppError("Invalid CreateBlock input", "VALIDATION_ERROR", {
      details: errors,
    });
  }

  return {
    name: name.trim(),
    description: description ? description.trim() : null,
    block_status,
    start_date: startDateObj,
    end_date: endDateObj,
    subjects: subjects ? subjects : [],
  };
}

/**
 * Validate input for update a Block.
 *
 * Required fields: name, block_status (enum), start_date.
 * - block_status must be one of: ACTIVE, ARCHIVED, DELETED.
 * - start_date and end_date must be valid dates.
 * - If subjects is provided, it must be an array of valid MongoDB ObjectIds.
 *
 * @param {Object} input - The input object from CreateBlock mutation.
 * @returns {Object} Validated and sanitized payload.
 * @throws {AppError} If any validation fails.
 */
function ValidateUpdateBlock(input) {
  const errors = [];

  // *************** Extract fields
  const { name, description, block_status, start_date, end_date, subjects } =
    input;

  // *************** Validate required fields

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("Field 'name' is required and must be a non-empty string.");
  }

  if (!block_status || !VALID_STATUSES.includes(block_status)) {
    errors.push(
      `Field 'block_status' is required"
      )}.`
    );
  }

  const startDateObj = new Date(start_date);
  if (!start_date || isNaN(startDateObj.getTime())) {
    errors.push("Field 'start_date' is required and must be a valid date.");
  }

  // *************** Optional field validation

  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      errors.push("Field 'description' must be a string if provided.");
    }
  }

  let endDateObj = null;
  if (end_date) {
    endDateObj = new Date(end_date);
    if (isNaN(endDateObj.getTime())) {
      errors.push("Field 'end_date' must be a valid date if provided.");
    } else if (!isNaN(startDateObj.getTime()) && endDateObj <= startDateObj) {
      errors.push("Field 'end_date' must be after 'start_date'.");
    }
  }

  if (subjects !== undefined) {
    if (!Array.isArray(subjects)) {
      errors.push("Field 'subjects' must be an array if provided.");
    } else {
      for (const id of subjects) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push(`Invalid subject ID: ${id}`);
          break;
        }
      }
    }
  }

  // *************** Throw if validation failed
  if (errors.length > 0) {
    throw createAppError("Invalid UpdateBlock input", "VALIDATION_ERROR", {
      details: errors,
    });
  }

  return {
    name: name.trim(),
    description: description ? description.trim() : null,
    block_status,
    start_date: startDateObj,
    end_date: endDateObj,
    subjects: subjects ? subjects : [],
  };
}

module.exports = {
  ValidateCreateBlock,
  ValidateUpdateBlock,
};

// *************** IMPORT HELPER ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT LIBRARY ***************
const mongoose = require("mongoose");

// *************** Enum
const VALID_STATUSES = ["ACTIVE", "ARCHIVED", "DELETED"];
const VALID_LOGIC = ["AND", "OR"];
const VALID_RULE_TYPES = [
  "SUBJECT_PASS_STATUS",
  "TEST_PASS_STATUS",
  "BLOCK_AVERAGE",
];
const VALID_EXPECTED_OUTCOME = ["PASS", "FAIL"];
const VALID_RULE_OPERATOR = ["EQ", "GTE", "GT", "LTE", "LT"];

/**
 * Validates and sanitizes input for creating a Block entity.
 *
 * Checks required fields such as name, status, passing criteria, start date,
 * and optional fields like description, end date, and subjects.
 * Throws `CreateAppError` if validation fails.
 *
 * @param {Object} input - Input data for creating a block.
 * @param {string} input.name - Required block name.
 * @param {string} [input.description] - Optional block description.
 * @param {string} input.block_status - Must be one of: ACTIVE, ARCHIVED, DELETED.
 * @param {Object} input.criteria - Required passing criteria with logic and rules.
 * @param {string|Date} input.start_date - Required valid start date.
 * @param {string|Date} [input.end_date] - Optional end date, must be after start_date.
 * @param {Array<string>} [input.subjects] - Optional array of subject ObjectIds.
 *
 * @returns {Object} Validated and normalized block data.
 */
function ValidateCreateBlock(input) {
  const {
    name,
    description,
    block_status,
    criteria,
    start_date,
    end_date,
    subjects,
  } = input;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw CreateAppError(
      "Field 'name' is required and must be a non-empty string.",
      "VALIDATION_ERROR"
    );
  }

  if (!block_status || !VALID_STATUSES.includes(block_status)) {
    throw CreateAppError(
      "Field 'block_status' is required and must be one of ACTIVE, ARCHIVED, DELETED.",
      "VALIDATION_ERROR"
    );
  }

  const startDateObj = new Date(start_date);
  if (!start_date || isNaN(startDateObj.getTime())) {
    throw CreateAppError(
      "Field 'start_date' is required and must be a valid date.",
      "VALIDATION_ERROR"
    );
  }

  if (!criteria || typeof criteria !== "object") {
    throw CreateAppError(
      "Field 'criteria' is required and must be an object.",
      "VALIDATION_ERROR"
    );
  }

  if (!VALID_LOGIC.includes(criteria.logic)) {
    throw CreateAppError(
      "Field 'criteria.logic' must be 'AND' or 'OR'.",
      "VALIDATION_ERROR"
    );
  }

  if (!Array.isArray(criteria.rules) || criteria.rules.length === 0) {
    throw CreateAppError(
      "Field 'criteria.rules' must be a non-empty array.",
      "VALIDATION_ERROR"
    );
  }

  if (description !== undefined && typeof description !== "string") {
    throw CreateAppError(
      "Field 'description' must be a string if provided.",
      "VALIDATION_ERROR"
    );
  }

  let endDateObj = null;
  if (end_date) {
    endDateObj = new Date(end_date);
    if (isNaN(endDateObj.getTime())) {
      throw CreateAppError(
        "Field 'end_date' must be a valid date if provided.",
        "VALIDATION_ERROR"
      );
    }
    if (endDateObj <= startDateObj) {
      throw CreateAppError(
        "Field 'end_date' must be after 'start_date'.",
        "VALIDATION_ERROR"
      );
    }
  }

  if (subjects !== undefined) {
    if (!Array.isArray(subjects)) {
      throw CreateAppError(
        "Field 'subjects' must be an array if provided.",
        "VALIDATION_ERROR"
      );
    }
    for (const id of subjects) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw CreateAppError(`Invalid subject ID: ${id}`, "VALIDATION_ERROR");
      }
    }
  }

  const validatedRules = criteria.rules.map((rule, i) => {
    if (!VALID_RULE_OPERATOR.includes(rule.operator)) {
      throw CreateAppError(
        `Rule[${i}] has invalid operator '${rule.operator}'.`,
        "VALIDATION_ERROR"
      );
    }

    if (!VALID_RULE_TYPES.includes(rule.type)) {
      throw CreateAppError(
        `Rule[${i}] has invalid type '${rule.type}'.`,
        "VALIDATION_ERROR"
      );
    }

    if (typeof rule.value !== "number" || rule.value <= 0) {
      throw CreateAppError(
        `Rule[${i}] 'value' must be a positive number.`,
        "VALIDATION_ERROR"
      );
    }

    if (!VALID_EXPECTED_OUTCOME.includes(rule.expected_outcome)) {
      throw CreateAppError(
        `Rule[${i}] 'expected_outcome' must be either 'PASS' or 'FAIL'.`,
        "VALIDATION_ERROR"
      );
    }

    if (
      (rule.type === "SUBJECT_PASS_STATUS") &&
      (!rule.subject_id || !mongoose.Types.ObjectId.isValid(rule.subject_id))
    ) {
      throw CreateAppError(
        `Rule[${i}] 'subject_id' is required and must be valid.`,
        "VALIDATION_ERROR"
      );
    }

    if (
      rule.type === "TEST_PASS_STATUS" &&
      (!rule.test_id || !mongoose.Types.ObjectId.isValid(rule.test_id))
    ) {
      throw CreateAppError(
        `Rule[${i}] 'test_id' is required and must be valid.`,
        "VALIDATION_ERROR"
      );
    }

    if (rule.type === "BLOCK_AVERAGE") {
      if (rule.subject_id || rule.test_id) {
        throw CreateAppError(
          `Rule[${i}] type 'BLOCK_AVERAGE' must not include 'subject_id' or 'test_id'.`,
          "VALIDATION_ERROR"
        );
      }
    }

    return {
      type: rule.type,
      subject_id: rule.subject_id || null,
      test_id: rule.test_id || null,
      operator: rule.operator,
      value: rule.value,
      expected_outcome: rule.expected_outcome,
    };
  });

  return {
    name: name.trim(),
    description: description ? description.trim() : null,
    block_status,
    criteria: {
      logic: criteria.logic,
      rules: validatedRules,
    },
    start_date: startDateObj,
    end_date: endDateObj,
    subjects: subjects || [],
  };
}

/**
 * Validates and sanitizes input for updating a Block entity.
 *
 * Checks fields like name, status, passing criteria, dates, and subject IDs.
 * Throws `CreateAppError` with code `VALIDATION_ERROR` if any validation fails.
 *
 * @param {Object} input - Input data for the block update.
 * @param {string} input.name - Block name (required, non-empty).
 * @param {string} [input.description] - Optional description.
 * @param {string} input.block_status - Must be one of: ACTIVE, ARCHIVED, DELETED.
 * @param {Object} [input.criteria] - Optional passing criteria config.
 * @param {string} input.criteria.logic - Logical operator: AND or OR.
 * @param {Array} input.criteria.rules - Rules array (required if criteria is present).
 * @param {string|Date} input.start_date - Required valid start date.
 * @param {string|Date} [input.end_date] - Optional end date (must be after start_date).
 * @param {Array<string>} [input.subjects] - Optional subject ObjectIds (must be valid).
 *
 * @returns {Object} Validated and sanitized block data ready for saving.
 */
function ValidateUpdateBlock(input) {
  const {
    name,
    description,
    block_status,
    criteria,
    start_date,
    end_date,
    subjects,
  } = input;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw CreateAppError(
      "Field 'name' is required and must be a non-empty string.",
      "VALIDATION_ERROR"
    );
  }

  if (!block_status || !VALID_STATUSES.includes(block_status)) {
    throw CreateAppError(
      "Field 'block_status' is required and must be one of ACTIVE, ARCHIVED, DELETED.",
      "VALIDATION_ERROR"
    );
  }

  let validatedRules = null;
  if (criteria && typeof criteria === "object") {
    if (!VALID_LOGIC.includes(criteria.logic)) {
      throw CreateAppError(
        "Field 'criteria.logic' must be 'AND' or 'OR'.",
        "VALIDATION_ERROR"
      );
    }

    if (!Array.isArray(criteria.rules) || criteria.rules.length === 0) {
      throw CreateAppError(
        "Field 'criteria.rules' must be a non-empty array.",
        "VALIDATION_ERROR"
      );
    }

    validatedRules = criteria.rules.map((rule, i) => {
      if (!VALID_RULE_OPERATOR.includes(rule.operator)) {
        throw CreateAppError(
          `Rule[${i}] has invalid operator '${rule.operator}'.`,
          "VALIDATION_ERROR"
        );
      }

      if (!VALID_RULE_TYPES.includes(rule.type)) {
        throw CreateAppError(
          `Rule[${i}] has invalid type '${rule.type}'.`,
          "VALIDATION_ERROR"
        );
      }

      if (typeof rule.value !== "number") {
        throw CreateAppError(
          `Rule[${i}] 'value' must be a number.`,
          "VALIDATION_ERROR"
        );
      }

      if (
        (rule.type === "SUBJECT_PASS_STATUS" ||
          rule.type === "BLOCK_AVERAGE") &&
        (!rule.subject_id || !mongoose.Types.ObjectId.isValid(rule.subject_id))
      ) {
        throw CreateAppError(
          `Rule[${i}] 'subject_id' is required and must be valid.`,
          "VALIDATION_ERROR"
        );
      }

      if (
        rule.type === "TEST_PASS_STATUS" &&
        (!rule.test_id || !mongoose.Types.ObjectId.isValid(rule.test_id))
      ) {
        throw CreateAppError(
          `Rule[${i}] 'test_id' is required and must be valid.`,
          "VALIDATION_ERROR"
        );
      }

      return {
        type: rule.type,
        subject_id: rule.subject_id || null,
        test_id: rule.test_id || null,
        operator: rule.operator,
        value: rule.value,
      };
    });
  }

  const startDateObj = new Date(start_date);
  if (!start_date || isNaN(startDateObj.getTime())) {
    throw CreateAppError(
      "Field 'start_date' is required and must be a valid date.",
      "VALIDATION_ERROR"
    );
  }

  if (description !== undefined && typeof description !== "string") {
    throw CreateAppError(
      "Field 'description' must be a string if provided.",
      "VALIDATION_ERROR"
    );
  }

  let endDateObj = null;
  if (end_date) {
    endDateObj = new Date(end_date);
    if (isNaN(endDateObj.getTime())) {
      throw CreateAppError(
        "Field 'end_date' must be a valid date if provided.",
        "VALIDATION_ERROR"
      );
    }
    if (endDateObj <= startDateObj) {
      throw CreateAppError(
        "Field 'end_date' must be after 'start_date'.",
        "VALIDATION_ERROR"
      );
    }
  }

  if (subjects !== undefined) {
    if (!Array.isArray(subjects)) {
      throw CreateAppError(
        "Field 'subjects' must be an array if provided.",
        "VALIDATION_ERROR"
      );
    }
    for (const id of subjects) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw CreateAppError(`Invalid subject ID: ${id}`, "VALIDATION_ERROR");
      }
    }
  }

  return {
    name: name.trim(),
    description: description ? description.trim() : null,
    block_status,
    criteria: criteria
      ? {
          logic: criteria.logic,
          rules: validatedRules,
        }
      : null,
    start_date: startDateObj,
    end_date: endDateObj,
    subjects: subjects || [],
  };
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateCreateBlock,
  ValidateUpdateBlock,
};

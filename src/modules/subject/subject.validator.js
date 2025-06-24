// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT UTILS ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id.js");

// *************** IMPORT HELPER ***************
const { CreateAppError } = require("../../core/error");

const VALID_LEVEL = ["ELEMENTARY", "MIDDLE", "HIGH"];
const VALID_CATEGORY = ["CORE", "ELECTIVE", "SUPPORT"];
const VALID_STATUS = ["ACTIVE", "ARCHIVED", "DELETED"];
const VALID_RULE_TYPE = ["TEST_SCORE", "AVERAGE"];
const VALID_RULE_OPERATOR = ["EQ", "GTE", "GT", "LTE", "LT"];
const VALID_LOGIC_OPERATOR = ["AND", "OR"];

/**
 * Validates and sanitizes input for creating a Subject entity.
 *
 * Ensures required fields like name, code, level, block ID, coefficient,
 * and passing criteria are valid. Also checks optional fields like
 * description, tests, and category. Throws `CreateAppError` if validation fails.
 *
 * @param {Object} input - Input data for creating a subject.
 * @param {string} input.name - Required subject name (non-empty).
 * @param {string} input.subject_code - Required subject code (non-empty).
 * @param {string} input.level - Required level, must be in VALID_LEVEL.
 * @param {string} [input.description] - Optional subject description.
 * @param {string} [input.category] - Optional category, must be in VALID_CATEGORY if provided.
 * @param {string} input.block_id - Required valid block ObjectId.
 * @param {number} input.coefficient - Required non-negative number.
 * @param {Array<string>} [input.tests] - Optional array of valid test ObjectIds.
 * @param {Object} input.criteria - Required passing criteria object.
 * @param {string} input.criteria.logic - Must be 'AND' or 'OR'.
 * @param {Array<Object>} input.criteria.rules - Non-empty array of valid rule objects.
 * @param {string} [input.subject_status] - Optional status, defaults to 'ACTIVE'.
 *
 * @returns {Object} Validated and sanitized subject data.
 */
function ValidateCreateSubject(input) {
  if (typeof input !== "object" || input === null) {
    throw CreateAppError("Invalid input format", "BAD_REQUEST");
  }

  const {
    name,
    subject_code,
    description,
    level,
    category,
    block_id,
    coefficient,
    tests,
    criteria,
    subject_status,
  } = input;

  if (!name || typeof name !== "string" || name.trim() === "") {
    throw CreateAppError("Subject name is required", "BAD_REQUEST", { name });
  }

  if (
    !subject_code ||
    typeof subject_code !== "string" ||
    subject_code.trim() === ""
  ) {
    throw CreateAppError("Subject code is required", "BAD_REQUEST", {
      subject_code,
    });
  }

  if (!VALID_LEVEL.includes(level)) {
    throw CreateAppError("Invalid subject level", "BAD_REQUEST", { level });
  }

  if (category && !VALID_CATEGORY.includes(category)) {
    throw CreateAppError("Invalid subject category", "BAD_REQUEST", {
      category,
    });
  }

  if (!block_id || !isValidObjectId(block_id)) {
    throw CreateAppError("Invalid or missing block_id", "BAD_REQUEST", {
      block_id,
    });
  }

  if (
    !criteria ||
    typeof criteria !== "object" ||
    !VALID_LOGIC_OPERATOR.includes(criteria.logic)
  ) {
    throw CreateAppError(
      "Invalid or missing criteria.logic. Must be 'AND' or 'OR'.",
      "VALIDATION_ERROR",
      { field: "criteria.logic" }
    );
  }

  const { rules } = criteria;
  if (!Array.isArray(rules) || rules.length === 0) {
    throw CreateAppError(
      "At least one rule is required in criteria.rules",
      "VALIDATION_ERROR",
      { field: "criteria.rules" }
    );
  }

  const validatedRules = rules.map((rule, index) => {
    const path = `criteria.rules[${index}]`;

    if (!VALID_RULE_OPERATOR.includes(rule.operator)) {
      throw CreateAppError(
        `Invalid rule.operator at ${path}. Must be one of ${VALID_RULE_OPERATOR.join(
          ", "
        )}`,
        "VALIDATION_ERROR",
        { field: `${path}.operator` }
      );
    }

    if (!VALID_RULE_TYPE.includes(rule.type)) {
      throw CreateAppError(
        `Invalid rule.type at ${path}. Must be one of ${VALID_RULE_TYPE.join(
          ", "
        )}`,
        "VALIDATION_ERROR",
        { field: `${path}.type` }
      );
    }

    if (typeof rule.value !== "number") {
      throw CreateAppError(
        `rule.value must be a number at ${path}`,
        "VALIDATION_ERROR",
        { field: `${path}.value` }
      );
    }

    if (rule.type === "TEST_SCORE") {
      if (!rule.test_id || !ValidateMongoId(rule.test_id, false)) {
        throw CreateAppError(
          `test_id is required and must be a valid ObjectId for TEST_SCORE at ${path}`,
          "VALIDATION_ERROR",
          { field: `${path}.test_id` }
        );
      }
    }

    if (rule.type === "AVERAGE" && rule.test_id) {
      throw CreateAppError(
        `test_id must not be provided for AVERAGE type at ${path}`,
        "VALIDATION_ERROR",
        { field: `${path}.test_id` }
      );
    }

    return {
      type: rule.type,
      operator: rule.operator,
      value: rule.value,
      test_id: rule.test_id ?? null,
    };
  });

  criteria.rules = validatedRules;

  if (typeof coefficient !== "number" || coefficient < 0) {
    throw CreateAppError(
      "Coefficient must be a non-negative number",
      "BAD_REQUEST",
      { coefficient }
    );
  }

  if (
    tests &&
    (!Array.isArray(tests) || tests.some((id) => !isValidObjectId(id)))
  ) {
    throw CreateAppError(
      "Tests must be an array of valid ObjectIds",
      "BAD_REQUEST",
      { tests }
    );
  }

  const status = subject_status || "ACTIVE";
  if (!VALID_STATUS.includes(status)) {
    throw CreateAppError("Invalid subject status", "BAD_REQUEST", {
      subject_status,
    });
  }

  return {
    name: name.trim(),
    subject_code: subject_code.trim(),
    description: description ?? null,
    level,
    category: category ?? null,
    block_id,
    coefficient,
    tests: tests ?? [],
    criteria,
    subject_status: status,
  };
}

/**
 * Validates and sanitizes input for updating a Subject entity.
 *
 * Ensures required fields like name, subject_code, level, block_id, coefficient,
 * and criteria are valid. Also validates optional fields such as
 * description, category, tests, and subject_status.
 * Throws `CreateAppError` if validation fails.
 *
 * @param {Object} input - Subject update payload.
 * @param {string} input.name - Required subject name (non-empty).
 * @param {string} input.subject_code - Required subject code (non-empty).
 * @param {string} input.level - Required level (must match VALID_LEVEL).
 * @param {string} [input.description] - Optional subject description.
 * @param {string} [input.category] - Optional category (must match VALID_CATEGORY if provided).
 * @param {string} input.block_id - Required valid block ObjectId.
 * @param {number} input.coefficient - Required non-negative number.
 * @param {Array<string>} [input.tests] - Optional array of valid test ObjectIds.
 * @param {Object} input.criteria - Required object containing logic and rules.
 * @param {string} input.criteria.logic - Must be 'AND' or 'OR'.
 * @param {Array<Object>} input.criteria.rules - Array of rule objects with validation.
 * @param {string} [input.subject_status] - Optional status (defaults to ACTIVE).
 *
 * @returns {Object} Validated and normalized subject data.
 */
function ValidateUpdateSubject(input) {
  if (typeof input !== "object" || input === null) {
    throw CreateAppError("Invalid input format", "BAD_REQUEST");
  }

  const {
    name,
    subject_code,
    description,
    level,
    category,
    block_id,
    coefficient,
    tests,
    criteria,
    subject_status,
  } = input;

  if (!name || typeof name !== "string" || name.trim() === "") {
    throw CreateAppError("Subject name is required", "BAD_REQUEST", { name });
  }

  if (
    !subject_code ||
    typeof subject_code !== "string" ||
    subject_code.trim() === ""
  ) {
    throw CreateAppError("Subject code is required", "BAD_REQUEST", {
      subject_code,
    });
  }

  if (!VALID_LEVEL.includes(level)) {
    throw CreateAppError("Invalid subject level", "BAD_REQUEST", { level });
  }

  if (category && !VALID_CATEGORY.includes(category)) {
    throw CreateAppError("Invalid subject category", "BAD_REQUEST", {
      category,
    });
  }

  if (!block_id || !isValidObjectId(block_id)) {
    throw CreateAppError("Invalid or missing block_id", "BAD_REQUEST", {
      block_id,
    });
  }

  if (
    !criteria ||
    typeof criteria !== "object" ||
    !VALID_LOGIC_OPERATOR.includes(criteria.logic)
  ) {
    throw CreateAppError(
      "Invalid or missing criteria.logic. Must be 'AND' or 'OR'.",
      "VALIDATION_ERROR",
      { field: "criteria.logic" }
    );
  }

  const { rules } = criteria;
  if (!Array.isArray(rules) || rules.length === 0) {
    throw CreateAppError(
      "At least one rule is required in criteria.rules",
      "VALIDATION_ERROR",
      { field: "criteria.rules" }
    );
  }

  const validatedRules = rules.map((rule, index) => {
    const path = `criteria.rules[${index}]`;

    if (!VALID_RULE_OPERATOR.includes(rule.operator)) {
      throw CreateAppError(
        `Invalid rule.operator at ${path}. Must be one of ${VALID_RULE_OPERATOR.join(
          ", "
        )}`,
        "VALIDATION_ERROR",
        { field: `${path}.operator` }
      );
    }

    if (!VALID_RULE_TYPE.includes(rule.type)) {
      throw CreateAppError(
        `Invalid rule.type at ${path}. Must be one of ${VALID_RULE_TYPE.join(
          ", "
        )}`,
        "VALIDATION_ERROR",
        { field: `${path}.type` }
      );
    }

    if (typeof rule.value !== "number") {
      throw CreateAppError(
        `rule.value must be a number at ${path}`,
        "VALIDATION_ERROR",
        { field: `${path}.value` }
      );
    }

    if (rule.type === "TEST_SCORE") {
      if (!rule.test_id || !ValidateMongoId(rule.test_id, false)) {
        throw CreateAppError(
          `test_id is required and must be a valid ObjectId for TEST_SCORE at ${path}`,
          "VALIDATION_ERROR",
          { field: `${path}.test_id` }
        );
      }
    }

    if (rule.type === "AVERAGE" && rule.test_id) {
      throw CreateAppError(
        `test_id must not be provided for AVERAGE type at ${path}`,
        "VALIDATION_ERROR",
        { field: `${path}.test_id` }
      );
    }

    return {
      type: rule.type,
      operator: rule.operator,
      value: rule.value,
      test_id: rule.test_id ?? null,
    };
  });

  criteria.rules = validatedRules;

  if (typeof coefficient !== "number" || coefficient < 0) {
    throw CreateAppError(
      "Coefficient must be a non-negative number",
      "BAD_REQUEST",
      { coefficient }
    );
  }

  if (
    tests &&
    (!Array.isArray(tests) || tests.some((id) => !isValidObjectId(id)))
  ) {
    throw CreateAppError(
      "Tests must be an array of valid ObjectIds",
      "BAD_REQUEST",
      { tests }
    );
  }

  const status = subject_status || "ACTIVE";
  if (!VALID_STATUS.includes(status)) {
    throw CreateAppError("Invalid subject status", "BAD_REQUEST", {
      subject_status,
    });
  }

  return {
    name: name.trim(),
    subject_code: subject_code.trim(),
    description: description ?? null,
    level,
    category: category ?? null,
    block_id,
    coefficient,
    tests: tests ?? [],
    criteria,
    subject_status: status,
  };
}

module.exports = {
  ValidateCreateSubject,
  ValidateUpdateSubject,
};

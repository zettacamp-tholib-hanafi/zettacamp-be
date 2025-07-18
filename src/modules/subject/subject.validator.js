// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT UTILITIES ***************
const {
  SUBJECT,
  OPERATOR_ENUM,
  LOGIC_ENUM,
  EXPECTED_OUTCOME_ENUM,
} = require("../../shared/utils/enum.js");

// *************** IMPORT HELPER FUNCTION ***************
const SubjectModel = require("./subject.model.js");
const Block = require("../block/block.model.js");

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
 * @param {string} input.level - Required level, must be in SUBJECT.VALID_LEVEL.
 * @param {string} [input.description] - Optional subject description.
 * @param {string} [input.category] - Optional category, must be in SUBJECT.VALID_CATEGORY if provided.
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
async function ValidateCreateSubject(input) {
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

  if (!SUBJECT.VALID_LEVEL.includes(level)) {
    throw CreateAppError("Invalid subject level", "BAD_REQUEST", { level });
  }

  if (category && !SUBJECT.VALID_CATEGORY.includes(category)) {
    throw CreateAppError("Invalid subject category", "BAD_REQUEST", {
      category,
    });
  }

  if (!block_id || !isValidObjectId(block_id)) {
    throw CreateAppError("Invalid or missing block_id", "BAD_REQUEST", {
      block_id,
    });
  }
  const block = await Block.findOne({
    _id: block_id,
    block_status: { $ne: "DELETED" },
  }).lean();

  if (!block) {
    throw CreateAppError("Block not found", "NOT_FOUND", { block_id });
  }

  let validatedCriteria = null;

  if (criteria) {
    if (!Array.isArray(criteria) || criteria.length === 0) {
      throw CreateAppError(
        "Field 'criteria' must be a non-empty array of groups.",
        "VALIDATION_ERROR"
      );
    }
    const passCount = criteria.filter(
      (criteria) => criteria.expected_outcome === "PASS"
    ).length;
    const failCount = criteria.filter(
      (criteria) => criteria.expected_outcome === "FAIL"
    ).length;

    if (passCount !== 1 || failCount !== 1) {
      throw CreateAppError(
        `Criteria group[${groupIndex}] must contain 1 PASS and 1 FAIL rule.`,
        "INVALID_EXPECTED_OUTCOME_COMPOSITION"
      );
    }
    validatedCriteria = criteria.map((group, groupIndex) => {
      const { expected_outcome, rules } = group;

      const ruleSignature = new Set();

      rules.forEach((rule, ruleIndex) => {
        const signature = `${rule.type}_${rule.operator}_${rule.value}`;
        if (ruleSignature.has(signature)) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] has duplicate or conflicting rule: '${rule.operator} ${rule.value}'`,
            "REDUNDANT_RULE_DETECTED"
          );
        }
        ruleSignature.add(signature);
      });

      if (!EXPECTED_OUTCOME_ENUM.includes(expected_outcome)) {
        throw CreateAppError(
          `Group[${groupIndex}] has invalid expected_outcome. Must be one of: ${EXPECTED_OUTCOME_ENUM.join(
            ", "
          )}`,
          "VALIDATION_ERROR"
        );
      }

      if (!Array.isArray(rules) || rules.length === 0) {
        throw CreateAppError(
          `Group[${groupIndex}] must contain non-empty 'rules' array.`,
          "VALIDATION_ERROR"
        );
      }

      if (rules.length !== 2) {
        throw CreateAppError(
          `Criteria group[${groupIndex}] must contain exactly 2 rules: one PASS and one FAIL.`,
          "INVALID_CRITERIA_STRUCTURE"
        );
      }

      const validatedRules = rules.map((rule, ruleIndex) => {
        const { logical_operator, type, test_id, operator, value } = rule;

        if (
          ruleIndex === 0 &&
          logical_operator !== null &&
          logical_operator !== undefined
        ) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] should not have 'logical_operator'. It must be null or omitted.`,
            "VALIDATION_ERROR"
          );
        }

        if (ruleIndex > 0 && !LOGIC_ENUM.includes(logical_operator)) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] 'logical_operator' must be one of: ${LOGIC_ENUM.join(
              ", "
            )}`,
            "VALIDATION_ERROR"
          );
        }

        if (!SUBJECT.VALID_CONDITION_TYPE.includes(type)) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] has invalid type '${type}'`,
            "VALIDATION_ERROR"
          );
        }

        if (!OPERATOR_ENUM.includes(operator)) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] has invalid operator '${operator}'`,
            "VALIDATION_ERROR"
          );
        }

        if (typeof value !== "number" || value < 0) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] 'value' must be a non-negative number`,
            "VALIDATION_ERROR"
          );
        }

        if (type === "TEST_SCORE" && (!test_id || !isValidObjectId(test_id))) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] of type TEST_SCORE requires valid 'test_id'`,
            "VALIDATION_ERROR"
          );
        }

        if (type === "AVERAGE" && test_id) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] of type AVERAGE must not have 'test_id'`,
            "VALIDATION_ERROR"
          );
        }

        return {
          logical_operator: ruleIndex === 0 ? null : logical_operator,
          type,
          test_id: test_id || null,
          operator,
          value,
        };
      });

      return {
        expected_outcome,
        rules: validatedRules,
      };
    });
  }

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
  if (!SUBJECT.VALID_STATUS.includes(status)) {
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
    criteria: validatedCriteria,
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
 * @param {string} input.level - Required level (must match SUBJECT.VALID_LEVEL).
 * @param {string} [input.description] - Optional subject description.
 * @param {string} [input.category] - Optional category (must match SUBJECT.VALID_CATEGORY if provided).
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
async function ValidateUpdateSubject(id, input) {
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

  const existsSubject = await SubjectModel.exists({
    _id: id,
    subject_status: { $ne: "DELETED" },
  });

  if (!existsSubject) {
    throw CreateAppError(
      `Subject with ID '${id}' not found or has been deleted.`,
      "VALIDATION_ERROR"
    );
  }

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

  if (!SUBJECT.VALID_LEVEL.includes(level)) {
    throw CreateAppError("Invalid subject level", "BAD_REQUEST", { level });
  }

  if (category && !SUBJECT.VALID_CATEGORY.includes(category)) {
    throw CreateAppError("Invalid subject category", "BAD_REQUEST", {
      category,
    });
  }

  if (!block_id || !isValidObjectId(block_id)) {
    throw CreateAppError("Invalid or missing block_id", "BAD_REQUEST", {
      block_id,
    });
  }
  const block = await Block.findOne({
    _id: block_id,
    block_status: { $ne: "DELETED" },
  }).lean();

  if (!block) {
    throw CreateAppError("Block not found", "NOT_FOUND", { block_id });
  }

  let validatedCriteria = null;

  if (criteria) {
    if (!Array.isArray(criteria) || criteria.length === 0) {
      throw CreateAppError(
        "Field 'criteria' must be a non-empty array of groups.",
        "VALIDATION_ERROR"
      );
    }

    const passCount = criteria.filter(
      (criteria) => criteria.expected_outcome === "PASS"
    ).length;
    const failCount = criteria.filter(
      (criteria) => criteria.expected_outcome === "FAIL"
    ).length;

    if (passCount !== 1 || failCount !== 1) {
      throw CreateAppError(
        `Criteria group[${groupIndex}] must contain 1 PASS and 1 FAIL rule.`,
        "INVALID_EXPECTED_OUTCOME_COMPOSITION"
      );
    }

    validatedCriteria = criteria.map((group, groupIndex) => {
      const { expected_outcome, rules } = group;

      const ruleSignature = new Set();

      rules.forEach((rule, ruleIndex) => {
        const signature = `${rule.type}_${rule.operator}_${rule.value}`;
        if (ruleSignature.has(signature)) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] has duplicate or conflicting rule: '${rule.operator} ${rule.value}'`,
            "REDUNDANT_RULE_DETECTED"
          );
        }
        ruleSignature.add(signature);
      });

      if (!EXPECTED_OUTCOME_ENUM.includes(expected_outcome)) {
        throw CreateAppError(
          `Group[${groupIndex}] has invalid expected_outcome. Must be one of: ${EXPECTED_OUTCOME_ENUM.join(
            ", "
          )}`,
          "VALIDATION_ERROR"
        );
      }

      if (!Array.isArray(rules) || rules.length === 0) {
        throw CreateAppError(
          `Group[${groupIndex}] must contain non-empty 'rules' array.`,
          "VALIDATION_ERROR"
        );
      }

      const validatedRules = rules.map((rule, ruleIndex) => {
        const { logical_operator, type, test_id, operator, value } = rule;

        if (
          ruleIndex === 0 &&
          logical_operator !== null &&
          logical_operator !== undefined
        ) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] should not have 'logical_operator'. It must be null or omitted.`,
            "VALIDATION_ERROR"
          );
        }

        if (ruleIndex > 0 && !LOGIC_ENUM.includes(logical_operator)) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] 'logical_operator' must be one of: ${LOGIC_ENUM.join(
              ", "
            )}`,
            "VALIDATION_ERROR"
          );
        }

        if (!SUBJECT.VALID_CONDITION_TYPE.includes(type)) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] has invalid type '${type}'`,
            "VALIDATION_ERROR"
          );
        }

        if (!OPERATOR_ENUM.includes(operator)) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] has invalid operator '${operator}'`,
            "VALIDATION_ERROR"
          );
        }

        if (typeof value !== "number" || value < 0) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] 'value' must be a non-negative number`,
            "VALIDATION_ERROR"
          );
        }

        if (type === "TEST_SCORE" && (!test_id || !isValidObjectId(test_id))) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] of type TEST_SCORE requires valid 'test_id'`,
            "VALIDATION_ERROR"
          );
        }

        if (type === "AVERAGE" && test_id) {
          throw CreateAppError(
            `Rule[${groupIndex}][${ruleIndex}] of type AVERAGE must not have 'test_id'`,
            "VALIDATION_ERROR"
          );
        }

        return {
          logical_operator: ruleIndex === 0 ? null : logical_operator,
          type,
          test_id: test_id || null,
          operator,
          value,
        };
      });

      return {
        expected_outcome,
        rules: validatedRules,
      };
    });
  }

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
  if (!SUBJECT.VALID_STATUS.includes(status)) {
    throw CreateAppError("Invalid subject status", "BAD_REQUEST", {
      subject_status,
    });
  }

  return {
    _id: id,
    name: name.trim(),
    subject_code: subject_code.trim(),
    description: description ?? null,
    level,
    category: category ?? null,
    block_id,
    coefficient,
    tests: tests ?? [],
    criteria: validatedCriteria,
    subject_status: status,
  };
}

module.exports = {
  ValidateCreateSubject,
  ValidateUpdateSubject,
};

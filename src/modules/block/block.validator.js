// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT MODULE **************
const BlockModel = require("./block.model");

// *************** IMPORT UTILITIES ***************
const {
  BLOCK,
  LOGIC_ENUM,
  EXPECTED_OUTCOME_ENUM,
  OPERATOR_ENUM,
} = require("../../shared/utils/enum");

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
async function ValidateCreateBlock(input) {
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

  if (!block_status || !BLOCK.VALID_STATUS.includes(block_status)) {
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
  let validatedCriteria = null;
  if (criteria) {
    if (!Array.isArray(criteria) || criteria.length === 0) {
      throw CreateAppError(
        "Field 'criteria' must be a non-empty array.",
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
          `Criteria group[${groupIndex}] has invalid expected_outcome`,
          "VALIDATION_ERROR"
        );
      }

      if (!Array.isArray(rules) || rules.length === 0) {
        throw CreateAppError(
          `Criteria group[${groupIndex}] must have non-empty 'rules' array`,
          "VALIDATION_ERROR"
        );
      }

      const validatedRules = rules.map((rule, ruleIndex) => {
        const { logical_operator, type, subject_id, test_id, operator, value } =
          rule;

        if (
          ruleIndex === 0 &&
          logical_operator !== null &&
          logical_operator !== undefined
        ) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[0] should not have 'logical_operator'.`,
            "VALIDATION_ERROR"
          );
        }

        if (ruleIndex > 0 && !LOGIC_ENUM.includes(logical_operator)) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}]: 'logical_operator' must be one of ${LOGIC_ENUM.join(
              ", "
            )}`,
            "VALIDATION_ERROR"
          );
        }

        if (!BLOCK.RULE_TYPE.includes(type)) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] has invalid 'type'`,
            "VALIDATION_ERROR"
          );
        }

        if (!OPERATOR_ENUM.includes(operator)) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] has invalid 'operator'`,
            "VALIDATION_ERROR"
          );
        }

        if (typeof value !== "number" || value < 0) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] 'value' must be a positive number`,
            "VALIDATION_ERROR"
          );
        }

        if (
          type === "SUBJECT_PASS_STATUS" &&
          (!subject_id || !isValidObjectId(subject_id))
        ) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] requires a valid 'subject_id'`,
            "VALIDATION_ERROR"
          );
        }

        if (
          type === "TEST_PASS_STATUS" &&
          (!test_id || !isValidObjectId(test_id))
        ) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] requires a valid 'test_id'`,
            "VALIDATION_ERROR"
          );
        }

        if (type === "BLOCK_AVERAGE" && (subject_id || test_id)) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] of type 'BLOCK_AVERAGE' must not include 'subject_id' or 'test_id'`,
            "VALIDATION_ERROR"
          );
        }

        return {
          logical_operator: ruleIndex === 0 ? null : logical_operator,
          type,
          subject_id: subject_id || null,
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
    const invalidId = subjects.find((id) => !isValidObjectId(id));
    if (invalidId) {
      throw CreateAppError(
        `Invalid subject ID: ${invalidId}`,
        "VALIDATION_ERROR"
      );
    }
  }

  return {
    name: name.trim(),
    description: description ? description.trim() : null,
    block_status,
    criteria: validatedCriteria,
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
async function ValidateUpdateBlock(id, input) {
  const {
    name,
    description,
    block_status,
    criteria,
    start_date,
    end_date,
    subjects,
  } = input;
  const existBlock = await BlockModel.exists({
    _id: id,
    block_status: { $ne: "DELETED" },
  });

  if (!existBlock) {
    throw CreateAppError(
      `Block with ID '${id}' not found or has been deleted.`,
      "VALIDATION_ERROR"
    );
  }

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw CreateAppError(
      "Field 'name' is required and must be a non-empty string.",
      "VALIDATION_ERROR"
    );
  }

  if (!block_status || !BLOCK.VALID_STATUS.includes(block_status)) {
    throw CreateAppError(
      "Field 'block_status' is required and must be one of ACTIVE, ARCHIVED, DELETED.",
      "VALIDATION_ERROR"
    );
  }
  let validatedCriteria = null;

  if (criteria) {
    if (!Array.isArray(criteria) || criteria.length === 0) {
      throw CreateAppError(
        "Field 'criteria' must be a non-empty array.",
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
          `Criteria group[${groupIndex}] has invalid expected_outcome`,
          "VALIDATION_ERROR"
        );
      }

      if (!Array.isArray(rules) || rules.length === 0) {
        throw CreateAppError(
          `Criteria group[${groupIndex}] must have non-empty 'rules' array`,
          "VALIDATION_ERROR"
        );
      }
      const validatedRules = rules.map((rule, ruleIndex) => {
        const { logical_operator, type, subject_id, test_id, operator, value } =
          rule;

        if (
          ruleIndex === 0 &&
          logical_operator !== null &&
          logical_operator !== undefined
        ) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[0] should not have 'logical_operator'.`,
            "VALIDATION_ERROR"
          );
        }

        if (ruleIndex > 0 && !LOGIC_ENUM.includes(logical_operator)) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}]: 'logical_operator' must be one of ${LOGIC_ENUM.join(
              ", "
            )}`,
            "VALIDATION_ERROR"
          );
        }

        if (!BLOCK.RULE_TYPE.includes(type)) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] has invalid 'type'`,
            "VALIDATION_ERROR"
          );
        }

        if (!OPERATOR_ENUM.includes(operator)) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] has invalid 'operator'`,
            "VALIDATION_ERROR"
          );
        }

        if (typeof value !== "number" || value < 0) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] 'value' must be a positive number`,
            "VALIDATION_ERROR"
          );
        }

        if (
          type === "SUBJECT_PASS_STATUS" &&
          (!subject_id || !isValidObjectId(subject_id))
        ) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] requires a valid 'subject_id'`,
            "VALIDATION_ERROR"
          );
        }

        if (
          type === "TEST_PASS_STATUS" &&
          (!test_id || !isValidObjectId(test_id))
        ) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] requires a valid 'test_id'`,
            "VALIDATION_ERROR"
          );
        }

        if (type === "BLOCK_AVERAGE" && (subject_id || test_id)) {
          throw CreateAppError(
            `Group[${groupIndex}].rules[${ruleIndex}] of type 'BLOCK_AVERAGE' must not include 'subject_id' or 'test_id'`,
            "VALIDATION_ERROR"
          );
        }

        return {
          logical_operator: ruleIndex === 0 ? null : logical_operator,
          type,
          subject_id: subject_id || null,
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
    const invalidId = subjects.find((id) => !isValidObjectId(id));
    if (invalidId) {
      throw CreateAppError(
        `Invalid subject ID: ${invalidId}`,
        "VALIDATION_ERROR"
      );
    }
  }

  return {
    _id: id,
    name: name.trim(),
    description: description ? description.trim() : null,
    block_status,
    criteria: validatedCriteria,
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

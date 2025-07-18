// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT MODULE ***************
const Test = require("./test.model");
const User = require("../user/user.model");
const Subject = require("../subject/subject.model");

// *************** IMPORT UTILITIES ***************
const {
  TEST,
  OPERATOR_ENUM,
  EXPECTED_OUTCOME_ENUM,
  LOGIC_ENUM,
} = require("../../shared/utils/enum");

/**
 * Validates input for creating a Test.
 *
 * @param {Object} input - Input data for the test.
 * @returns {Promise<Object>} Validated and sanitized test payload with total_score included.
 * @throws {AppError} If any validation rule fails.
 */

async function ValidateCreateTest(input) {
  if (typeof input !== "object" || input === null) {
    throw CreateAppError("Invalid input format", "BAD_REQUEST");
  }

  const {
    name,
    subject_id,
    weight,
    notations,
    grading_method,
    test_status,
    attachments,
    criteria,
    published_date,
  } = input;

  // *************** Validate: name
  if (!name || typeof name !== "string" || name.trim() === "") {
    throw CreateAppError("Test name is required", "BAD_REQUEST", { name });
  }

  // *************** Validate: subject_id
  if (!subject_id || !isValidObjectId(subject_id)) {
    throw CreateAppError("Invalid or missing subject_id", "BAD_REQUEST", {
      subject_id,
    });
  }

  // *************** Validate: weight
  if (typeof weight !== "number" || weight < 0) {
    throw CreateAppError(
      "Weight must be a non-negative number",
      "BAD_REQUEST",
      { weight }
    );
  }

  // *************** Validate: notations
  if (!Array.isArray(notations) || notations.length === 0) {
    throw CreateAppError("Notations must be a non-empty array", "BAD_REQUEST", {
      notations,
    });
  }

  let total_score = 0;
  const notationTextSet = new Set();
  const sanitizedNotations = notations.map((notation, index) => {
    const { notation_text, max_points } = notation;

    if (!notation_text || typeof notation_text !== "string") {
      throw CreateAppError(
        `notation_text is required and must be a string at index ${index}`,
        "BAD_REQUEST",
        { notation_text }
      );
    }
    if (notationTextSet.has(notation_text)) {
      throw CreateAppError(
        "Duplicate notation_text not allowed",
        "BAD_REQUEST"
      );
    }

    if (typeof max_points !== "number" || max_points < 0 || max_points > 100) {
      throw CreateAppError(
        `max_points must be a non-negative number at index ${index}`,
        "BAD_REQUEST",
        { max_points }
      );
    }

    total_score += max_points;
    const notation_response = {
      notation_text: notation_text,
      max_points,
    };
    return notation_response;
  });

  // *************** Validate: criteria
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
        const signature = `${rule.operator}_${rule.value}`;
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
          `Criteria[${groupIndex}] 'expected_outcome' must be one of: ${EXPECTED_OUTCOME_ENUM.join(
            ", "
          )}`,
          "VALIDATION_ERROR"
        );
      }

      if (!Array.isArray(rules) || rules.length === 0) {
        throw CreateAppError(
          `Criteria[${groupIndex}] must contain a non-empty array of rules`,
          "VALIDATION_ERROR"
        );
      }

      const validatedRules = rules.map((rule, ruleIndex) => {
        const { logical_operator, operator, value } = rule;

        if (
          ruleIndex === 0 &&
          logical_operator !== null &&
          logical_operator !== undefined
        ) {
          throw CreateAppError(
            `Criteria[${groupIndex}].rules[${ruleIndex}] should not have 'logical_operator'.`,
            "VALIDATION_ERROR"
          );
        }

        if (ruleIndex > 0 && !LOGIC_ENUM.includes(logical_operator)) {
          throw CreateAppError(
            `Criteria[${groupIndex}].rules[${ruleIndex}] 'logical_operator' must be one of ${LOGIC_ENUM.join(
              ", "
            )}`,
            "VALIDATION_ERROR"
          );
        }

        if (!OPERATOR_ENUM.includes(operator)) {
          throw CreateAppError(
            `Criteria[${groupIndex}].rules[${ruleIndex}] has invalid operator '${operator}'`,
            "VALIDATION_ERROR"
          );
        }

        if (typeof value !== "number" || value < 0 || value > 100) {
          throw CreateAppError(
            `Criteria[${groupIndex}].rules[${ruleIndex}] 'value' must be a number between 0-100`,
            "VALIDATION_ERROR"
          );
        }

        return {
          logical_operator: ruleIndex === 0 ? null : logical_operator,
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

  // *************** Validate: grading_method (optional)
  if (grading_method && !TEST.VALID_GRADING_METHOD.includes(grading_method)) {
    throw CreateAppError("Invalid grading method", "BAD_REQUEST", {
      grading_method,
    });
  }

  // *************** Validate: test_status
  if (!test_status || !TEST.VALID_STATUS.includes(test_status)) {
    throw CreateAppError("Invalid or missing test_status", "BAD_REQUEST", {
      test_status,
    });
  }

  // *************** Validate: attachments (optional)
  if (attachments) {
    if (!Array.isArray(attachments)) {
      throw CreateAppError(
        "Attachments must be an array of URLs",
        "BAD_REQUEST",
        { attachments }
      );
    }
  }

  // *************** Validate: published_date (optional, only for PUBLISHED status)
  if (published_date !== undefined) {
    if (isNaN(Date.parse(published_date))) {
      throw CreateAppError("Invalid published_date format", "BAD_REQUEST", {
        published_date: published_date,
      });
    }

    if (test_status !== "PUBLISHED") {
      throw CreateAppError(
        "published_date is only allowed when test_status is PUBLISHED",
        "BAD_REQUEST",
        {
          published_date: published_date,
          test_status,
        }
      );
    }
  }

  const existingSubjectId = await Subject.findOne({
    _id: subject_id,
    subject_status: { $ne: "DELETED" },
  });

  if (!existingSubjectId) {
    throw CreateAppError(`Subject ID is Not Found!`, "BAD_REQUEST", {
      subject_id,
    });
  }

  const existingTests = await Test.find({
    subject_id,
    test_status: { $ne: "DELETED" },
  }).select("weight");

  const totalWeight =
    existingTests.reduce((sum, test) => sum + (test.weight || 0), 0) + weight;

  if (totalWeight > 1) {
    throw CreateAppError(
      `Combined test weight for subject exceeds 1. Current total would be ${totalWeight}`,
      "BAD_REQUEST",
      { subject_id, totalWeight }
    );
  }

  const callbackTestPayload = {
    name: name.trim(),
    subject_id,
    weight,
    notations: sanitizedNotations,
    total_score,
    grading_method: grading_method || "MANUAL",
    test_status,
    attachments: attachments || [],
    criteria: validatedCriteria,
    published_date,
  };
  return callbackTestPayload;
}

/**
 * Validates input for updating a Test entity.
 *
 * @param {String} id - MongoDB ObjectId of the Test to update.
 * @param {Object} input - Input object conforming to UpdateTestInput typedef.
 * @returns {Promise<Object>} - Sanitized and validated payload.
 * @throws {AppError} - On invalid structure, types, or enum mismatches.
 */
async function ValidateUpdateTest(id, input) {
  if (typeof input !== "object" || input === null) {
    throw CreateAppError("Invalid input format", "BAD_REQUEST");
  }

  const {
    name,
    subject_id,
    description,
    weight,
    notations,
    grading_method,
    criteria,
    test_status,
    attachments,
    published_date,
  } = input;

  const existTest = await Test.exists({
    _id: id,
    test_status: { $ne: "DELETED" },
  });

  if (!existTest) {
    throw CreateAppError(
      `Test with ID '${id}' not found or has been deleted.`,
      "VALIDATION_ERROR"
    );
  }

  // *************** Validate: name
  if (!name || typeof name !== "string" || name.trim() === "") {
    throw CreateAppError("Test name is required", "BAD_REQUEST", { name });
  }

  // *************** Validate: subject_id
  if (!subject_id || !isValidObjectId(subject_id)) {
    throw CreateAppError("Invalid or missing subject_id", "BAD_REQUEST", {
      subject_id,
    });
  }
  const subject = await Subject.findOne({
    _id: subject_id,
    subject_status: { $ne: "DELETED" },
  });

  if (!subject) {
    throw CreateAppError("Subject not found", "NOT_FOUND", {
      subject_id,
    });
  }

  // *************** Validate: weight
  if (typeof weight !== "number" || weight < 0) {
    throw CreateAppError(
      "Weight must be a non-negative number",
      "BAD_REQUEST",
      {
        weight,
      }
    );
  }

  // *************** Validate: notations
  if (!Array.isArray(notations) || notations.length === 0) {
    throw CreateAppError("Notations must be a non-empty array", "BAD_REQUEST", {
      notations,
    });
  }

  let total_score = 0;
  const notationTextSet = new Set();

  const sanitizedNotations = notations.map((notation, index) => {
    const { notation_text, max_points } = notation;

    if (!notation_text || typeof notation_text !== "string") {
      throw CreateAppError(
        `notation_text is required and must be a string at index ${index}`,
        "BAD_REQUEST",
        { notation_text }
      );
    }

    if (notationTextSet.has(notation_text)) {
      throw CreateAppError(
        "Duplicate notation_text not allowed",
        "BAD_REQUEST"
      );
    }

    if (typeof max_points !== "number" || max_points < 0 || max_points > 100) {
      throw CreateAppError(
        `max_points must be a non-negative number at index ${index}`,
        "BAD_REQUEST",
        { max_points }
      );
    }

    total_score += max_points;
    return {
      notation_text: notation_text,
      max_points,
    };
  });

  // *************** Validate: criteria
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
        const signature = `${rule.operator}_${rule.value}`;
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
          `Criteria[${groupIndex}] 'expected_outcome' must be one of: ${EXPECTED_OUTCOME_ENUM.join(
            ", "
          )}`,
          "VALIDATION_ERROR"
        );
      }

      if (!Array.isArray(rules) || rules.length === 0) {
        throw CreateAppError(
          `Criteria[${groupIndex}] must contain a non-empty array of rules`,
          "VALIDATION_ERROR"
        );
      }

      const validatedRules = rules.map((rule, ruleIndex) => {
        const { logical_operator, operator, value } = rule;

        if (
          ruleIndex === 0 &&
          logical_operator !== null &&
          logical_operator !== undefined
        ) {
          throw CreateAppError(
            `Criteria[${groupIndex}].rules[${ruleIndex}] should not have 'logical_operator'.`,
            "VALIDATION_ERROR"
          );
        }

        if (ruleIndex > 0 && !LOGIC_ENUM.includes(logical_operator)) {
          throw CreateAppError(
            `Criteria[${groupIndex}].rules[${ruleIndex}] 'logical_operator' must be one of ${LOGIC_ENUM.join(
              ", "
            )}`,
            "VALIDATION_ERROR"
          );
        }

        if (!OPERATOR_ENUM.includes(operator)) {
          throw CreateAppError(
            `Criteria[${groupIndex}].rules[${ruleIndex}] has invalid operator '${operator}'`,
            "VALIDATION_ERROR"
          );
        }

        if (typeof value !== "number" || value < 0 || value > 100) {
          throw CreateAppError(
            `Criteria[${groupIndex}].rules[${ruleIndex}] 'value' must be a number between 0-100`,
            "VALIDATION_ERROR"
          );
        }

        return {
          logical_operator: ruleIndex === 0 ? null : logical_operator,
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

  // *************** Validate: grading_method (optional)
  if (grading_method && !TEST.VALID_GRADING_METHOD.includes(grading_method)) {
    throw CreateAppError("Invalid grading method", "BAD_REQUEST", {
      grading_method,
    });
  }

  // *************** Validate: test_status
  if (!test_status || !TEST.VALID_STATUS.includes(test_status)) {
    throw CreateAppError("Invalid or missing test_status", "BAD_REQUEST", {
      test_status,
    });
  }

  // *************** Validate: attachments (optional)
  if (attachments && !Array.isArray(attachments)) {
    throw CreateAppError("Attachments must be an array", "BAD_REQUEST", {
      attachments,
    });
  }

  // *************** Validate: published_date
  if (published_date !== undefined) {
    if (isNaN(Date.parse(published_date))) {
      throw CreateAppError("Invalid published_date format", "BAD_REQUEST", {
        published_date,
      });
    }

    if (test_status !== "PUBLISHED") {
      throw CreateAppError(
        "published_date is only allowed when test_status is PUBLISHED",
        "BAD_REQUEST",
        { published_date, test_status }
      );
    }
  }

  // *************** Validate: weight quota
  const currentTest = await Test.findById(id).select("weight");
  if (!currentTest) {
    throw CreateAppError("Test not found", "NOT_FOUND", { id });
  }

  const otherTests = await Test.find({
    subject_id,
    test_status: { $ne: "DELETED" },
    _id: { $ne: id },
  }).select("weight");

  const combinedWeight =
    otherTests.reduce((sum, test) => sum + (test.weight || 0), 0) + weight;

  if (combinedWeight > 1) {
    throw CreateAppError(
      `Combined test weight exceeds 1. Current total: ${combinedWeight}`,
      "BAD_REQUEST",
      { subject_id, combinedWeight }
    );
  }

  const callbackTestPayload = {
    _id: id,
    name: name.trim(),
    subject_id,
    description: description ? description.trim() : null,
    weight,
    notations: sanitizedNotations,
    total_score,
    grading_method: grading_method || TEST.DEFAULT_GRADING_METHOD,
    criteria: validatedCriteria,
    test_status,
    attachments: attachments || [],
    published_date,
  };
  return callbackTestPayload;
}

/**
 * Validates assignCorrector input for publishing a test and assigning a corrector.
 *
 * @param {object} input - The input payload containing test_id, user_id, and due_date.
 * @returns {Promise<{ corrector: Object, test: Object }>}
 * @throws {AppError} If any validation fails.
 */
async function ValidateAssignCorrector(id, input) {
  const { user_id, due_date } = input;
  const errors = [];

  let corrector = null;
  let test = null;

  // *************** Validate Corrector (User)
  corrector = await User.findById(user_id);
  if (!corrector) {
    errors.push({ field: "user_id", message: "Corrector not found" });
  }

  // *************** Validate Test
  test = await Test.findById(id);
  if (!test) {
    errors.push({ field: "id", message: "Test not found" });
  } else if (test.test_status !== "DRAFT") {
    errors.push({
      field: "test_status",
      message: "Test must be in DRAFT status to be published",
    });
  }

  // *************** Validate Due Date (Optional, but must be a valid future date if provided)
  if (due_date) {
    const parsedDate = new Date(due_date);
    if (isNaN(parsedDate.getTime())) {
      errors.push({
        field: "due_date",
        message: "Due date must be a valid date",
      });
    } else if (parsedDate < new Date()) {
      errors.push({
        field: "due_date",
        message: "Due date must be in the future",
      });
    }
  }

  // *************** Throw if any errors found
  if (errors.length > 0) {
    throw CreateAppError("Validation failed", "BAD_USER_INPUT", { errors });
  }

  const callbackAssignCorrectorPayload = { corrector, due_date };
  return callbackAssignCorrectorPayload;
}

module.exports = {
  ValidateCreateTest,
  ValidateUpdateTest,
  ValidateAssignCorrector,
};

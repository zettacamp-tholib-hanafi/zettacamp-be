// *************** IMPORT LIBRARY ***************
const { parentPort } = require("worker_threads");
const fs = require("fs");
const path = require("path");

// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT MODULE **************
const StudentTestResult = require("../studentTestResult/student_test_result.model");
const CalculationResult = require("../calculationResult/calculation_result.model");
const Block = require("../block/block.model");
const Subject = require("../subject/subject.model");
const Test = require("../test/test.model");

// *************** IMPORT UTILITIES ***************
const { TimeNow } = require("../../shared/utils/time");

const RESULT_PASS = "PASS";
const RESULT_FAIL = "FAIL";
const STATUS_DELETED = "DELETED";
const CALCULATION_STATUS = "PUBLISHED";
/**
 * Execute transcript process logic.
 *
 * @param {ObjectId} student_id
 * @param {Object} loaders - Contains test, subject, and block DataLoaders
 * @returns {Promise<Object>} Transcript result
 */

async function RunTranscriptCore(student_id) {
  const studentTestResults = await FetchStudentTestResult(student_id);
  if (!studentTestResults) {
    throw CreateAppError("Missing test result", "DATA_MISSING");
  }

  const testResults = await CalculateTestResults(studentTestResults);
  if (!testResults) {
    throw CreateAppError("Error calculate test result", "DATA_MISSING");
  }

  const subjectIds = testResults.map((testResult) =>
    String(testResult.subject_id)
  );
  const subjects = await LoadSubjectsByIds(subjectIds);
  if (!subjects) {
    throw CreateAppError("Missing subject", "DATA_MISSING");
  }

  const subjectResults = await CalculateSubjectResults(testResults, subjects);
  if (!subjectResults) {
    throw CreateAppError("Error calculate subject result", "DATA_MISSING");
  }

  const blockIds = subjects.map((subject) => String(subject.block_id));
  const blocks = await LoadBlocksByIds(blockIds);
  if (!blocks) {
    throw CreateAppError("Missing block", "DATA_MISSING");
  }
  const blockResults = await CalculateBlockResults(subjectResults, blocks);
  if (!blockResults) {
    throw CreateAppError("Error calculate subject result", "DATA_MISSING");
  }

  const result = await CreateCalculationResult(student_id, blockResults);

  const sucessWorker = parentPort.postMessage({
    success: true,
    data: {
      student_id,
      result,
    },
    message: `Transcript calculated successfully at ${TimeNow()}`,
  });

  return sucessWorker;
}

/**
 * Fetch all non-deleted Student Test Results for a specific student.
 *
 * @param {string} student_id - The ID of the student to retrieve test results for.
 * @returns {Array} - List of StudentTestResult documents.
 * @throws {AppError} - If no test results found for the student.
 */
async function FetchStudentTestResult(student_id) {
  const result = await StudentTestResult.find({
    student_id,
    student_test_result_status: { $ne: STATUS_DELETED },
    mark_validated_date: { $ne: null },
  }).populate("test_id");

  if (!result || result.length === 0) {
    throw CreateAppError("Student Test Result not found", "NOT_FOUND", {
      student_id,
    });
  }

  const missingTest = result.find((result) => !result.test_id);
  if (missingTest) {
    throw CreateAppError(
      "Corrupted data: Missing test_id in result",
      "INTERNAL_SERVER_ERROR",
      {
        result_id: missingTest._id,
      }
    );
  }

  return result;
}

/**
 * Calculates the result of each test based on the student's average mark
 * and the test's weight. It also evaluates the pass/fail status using
 * the test’s criteria rules via `EvaluateCriteriaGroups`.
 *
 * Each test result includes:
 * - Raw average mark
 * - Weighted mark (based on test weight)
 * - Evaluation result (PASS/FAIL) from criteria rules
 *
 * Throws meaningful errors when critical data (e.g., test metadata or criteria)
 * is missing, corrupted, or invalid.
 *
 * @function CalculateTestResults
 * @param {Array<Object>} studentTestResults - List of test result entries for a student.
 * @param {Object} studentTestResults[].test_id - Populated test document.
 * @param {string} studentTestResults[].test_id._id - ID of the test.
 * @param {string} studentTestResults[].test_id.subject_id - ID of the subject the test belongs to.
 * @param {number} studentTestResults[].test_id.weight - Weight of the test for weighted score.
 * @param {Array<Object>} studentTestResults[].test_id.criteria - Array of evaluation rules for the test.
 * @param {string} studentTestResults[].average_mark - Student’s raw average mark in the test.
 *
 * @returns {Array<Object>} Array of calculated test result objects, each containing:
 * - `test_id` {ObjectId} — ID of the evaluated test
 * - `subject_id` {ObjectId} — ID of the related subject
 * - `average_mark` {number} — Student’s raw average mark
 * - `weighted_mark` {number} — Weighted score (average × weight)
 * - `test_result` {boolean} — PASS/FAIL result from criteria evaluation
 *
 * @throws {AppError} If test is not populated or test criteria is missing/invalid.
 *
 */

function CalculateTestResults(studentTestResults) {
  const result = studentTestResults.map((resultEntry) => {
    const test = resultEntry.test_id;

    if (!test || !test._id) {
      throw CreateAppError("Missing populated test data", "DATA_CORRUPTED", {
        result_id: resultEntry._id,
      });
    }

    const averageMark = Number(resultEntry.average_mark || 0);
    const weight = Number(test.weight || 0);
    const weightedMark = Number((averageMark * weight).toFixed(2));

    const criteria = test.criteria;
    if (!Array.isArray(criteria) || criteria.length === 0) {
      throw CreateAppError(
        "Criteria not found or invalid",
        "DATA_INTEGRITY_ERROR",
        { test_id: test._id }
      );
    }

    const test_result = EvaluateCriteriaGroups(criteria, averageMark, {
      test_id: test._id,
    });

    return {
      test_id: test._id,
      subject_id: test.subject_id,
      average_mark: averageMark,
      weighted_mark: weightedMark,
      test_result,
    };
  });

  return result;
}

/**
 * Calculates the subject-level results by aggregating test results,
 * applying subject-specific coefficients, and evaluating the defined
 * criteria to determine the PASS/FAIL status of each subject.
 *
 * For each subject, this function:
 * - Filters its related test results
 * - Computes the total weighted mark
 * - Computes the average mark from tests
 * - Applies subject coefficient to get final total
 * - Resolves dynamic values based on rule types
 * - Evaluates criteria using `EvaluateCriteriaGroups`
 *
 * Throws detailed errors when criteria or test data is missing
 * or improperly configured.
 *
 * @function CalculateSubjectResults
 * @param {Array<Object>} testResults - List of test results with their scores and metadata.
 * @param {string} testResults[].subject_id - ID of the subject the test belongs to.
 * @param {string} testResults[].test_id - ID of the test.
 * @param {number} testResults[].average_mark - The average mark achieved in the test.
 * @param {number} testResults[].weighted_mark - The weighted score of the test.
 *
 * @param {Array<Object>} subjects - List of subject definitions with criteria.
 * @param {string} subjects[].id - Subject ID.
 * @param {string} subjects[].block_id - ID of the block the subject belongs to.
 * @param {number} subjects[].coefficient - Weight of the subject in block calculation.
 * @param {Array<Object>} subjects[].criteria - List of evaluation rules for the subject.
 *
 * @returns {Array<Object>} Array of calculated subject results, each containing:
 * - `subject_id` {ObjectId}
 * - `block_id` {ObjectId}
 * - `average_mark` {number}
 * - `total_mark` {number}
 * - `subject_result` {boolean} PASS/FAIL based on criteria evaluation
 * - `coefficient` {number}
 * - `test_results` {Array<Object>} Test results contributing to the subject
 *
 * @throws {AppError} If criteria are missing, test data is required but not found,
 *                    or rule structure is invalid.
 *
 */

function CalculateSubjectResults(testResults, subjects) {
  const resultCalculation = subjects.map((subject) => {
    const subjectId = String(subject._id);

    const relatedTestResults = testResults.filter(
      (testResult) => String(testResult.subject_id) === subjectId
    );

    const totalWeightedMark = relatedTestResults
      .map((testResult) => Number(testResult.weighted_mark || 0))
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    const coefficient = Number(subject.coefficient || 1);
    const averageMark =
      relatedTestResults.length > 0
        ? relatedTestResults
            .map((testResult) => Number(testResult.average_mark || 0))
            .reduce((accumulator, current) => accumulator + current, 0) /
          relatedTestResults.length
        : 0;

    const totalMark = Number((coefficient * totalWeightedMark).toFixed(2));

    const criteria = subject.criteria;
    if (!Array.isArray(criteria) || criteria.length === 0) {
      throw CreateAppError(
        "Invalid or missing subject criteria",
        "INVALID_CRITERIA",
        { subject_id: subject._id }
      );
    }

    const resolveActualValue = (rule) => {
      const ruleType = rule.type || "AVERAGE";
      if (ruleType === "AVERAGE") return averageMark;

      if (ruleType === "TEST_SCORE" && rule.test_id) {
        if (
          relatedTestResults.length === 0 &&
          criteria.some((criteria) =>
            criteria.rules.some((rule) => rule.type === "TEST_SCORE")
          )
        ) {
          throw CreateAppError(
            "No test results found for subject with TEST_SCORE rules",
            "MISSING_TEST_DATA",
            { subject_id: subject._id }
          );
        }

        const test = relatedTestResults.find(
          (testResult) => String(testResult.test_id) === String(rule.test_id)
        );

        if (!test) {
          throw CreateAppError(
            "Test not found in subject result",
            "MISSING_TEST_DATA",
            {
              test_id: rule.test_id,
              subject_id: subject._id,
            }
          );
        }
        return Number(test.average_mark || 0);
      }

      throw CreateAppError("Invalid rule structure", "INVALID_RULE", {
        rule,
        subject_id: subject._id,
      });
    };

    const subject_result = EvaluateCriteriaGroups(criteria, null, {
      subject_id: subject._id,
      resolveActualValue,
    });

    return {
      subject_id: subject._id,
      block_id: subject.block_id,
      average_mark: averageMark,
      total_mark: totalMark,
      subject_result,
      coefficient: subject.coefficient,
      test_results: relatedTestResults,
    };
  });

  return resultCalculation;
}

/**
 * Calculates the final results for each block based on subject-level
 * results and the block’s evaluation criteria. The process includes:
 * - Aggregating subject scores with weighting via coefficient.
 * - Resolving dynamic values for rules (e.g., block average, subject/test pass).
 * - Evaluating the criteria tree using `EvaluateCriteriaGroups`.
 *
 * Throws detailed errors when data dependencies (e.g., subject or test results)
 * are missing or improperly configured.
 *
 * @async
 * @function CalculateBlockResults
 * @param {Array<Object>} subjectResults - List of subject-level results, including test results.
 * @param {string} subjectResults[].block_id - ID of the block this subject belongs to.
 * @param {string} subjectResults[].subject_id - ID of the subject.
 * @param {number} subjectResults[].total_mark - Total mark for the subject.
 * @param {number} subjectResults[].coefficient - Coefficient for weighted average.
 * @param {Array<Object>} subjectResults[].test_results - List of test results for this subject.
 * @param {string} subjectResults[].test_results[].test_id - ID of the test.
 * @param {number} subjectResults[].test_results[].average_mark - Average mark of the test.
 *
 * @param {Array<Object>} blocks - List of block entities with criteria to evaluate.
 * @param {string} blocks[].id - The unique ID of the block.
 * @param {Array<Object>} blocks[].criteria - Block-level criteria tree for evaluation.
 *
 * @returns {Promise<Array<Object>>} A list of computed block results.
 * Each result includes:
 * - `block_id` {ObjectId}
 * - `total_mark` {number} — Weighted average of all subject marks in the block.
 * - `block_result` {boolean} — PASS/FAIL based on criteria evaluation.
 * - `subject_results` {Array<Object>} — Subject results that contributed to this block.
 *
 * @throws {AppError} If required data (like criteria, subjects, or test results) is missing or invalid.
 *
 */
async function CalculateBlockResults(subjectResults, blocks) {
  const blockResults = blocks.map((block) => {
    const blockId = String(block._id);

    const subjectResultsForBlock = subjectResults.filter(
      (subjectResult) => String(subjectResult.block_id) === blockId
    );

    const { totalMarkSum, coefficientSum } = subjectResultsForBlock.reduce(
      (accumulator, subjectResult) => {
        const coef = Number(subjectResult.coefficient || 1);
        const mark = Number(subjectResult.total_mark || 0);
        accumulator.totalMarkSum += mark;
        accumulator.coefficientSum += coef;
        return accumulator;
      },
      { totalMarkSum: 0, coefficientSum: 0 }
    );

    const totalBlockMark =
      coefficientSum > 0
        ? Number((totalMarkSum / coefficientSum).toFixed(2))
        : 0;

    const criteria = block.criteria;
    if (!Array.isArray(criteria) || criteria.length === 0) {
      throw CreateAppError("Missing block criteria", "INVALID_CRITERIA", {
        block_id: block._id,
      });
    }

    const resolveActualValue = (rule) => {
      const { subject_id, test_id, type } = rule;

      if (type == "BLOCK_AVERAGE" && !subject_id && !test_id)
        return totalBlockMark;

      if (type == "SUBJECT_PASS_STATUS" && subject_id) {
        const subject = subjectResultsForBlock.find(
          (subjectResult) =>
            String(subjectResult.subject_id) === String(subject_id)
        );
        if (!subject) {
          if (!subject.average_mark) {
            throw CreateAppError("Subject Average Not Found", "NOT_FOUND", {
              subject_id,
            });
          }
          throw CreateAppError("Subject Not Found", "NOT_FOUND", {
            subject_id,
          });
        }

        return subject.average_mark;
      }

      if (type == "TEST_PASS_STATUS" && test_id) {
        const subject = subjectResultsForBlock.find((subjectResult) =>
          subjectResult.test_results.some(
            (testResult) => String(testResult.test_id) === String(test_id)
          )
        );
        const test = subject?.test_results.find(
          (testResult) => String(testResult.test_id) === String(test_id)
        );
        if (!test) {
          if (!test.average_mark) {
            throw CreateAppError("Test Average Not Found", "NOT_FOUND", {
              test_id,
            });
          }
          throw CreateAppError("Test Not Found", "NOT_FOUND", {
            test_id,
          });
        }
        return test.average_mark;
      }

      return 0;
    };

    const block_result = EvaluateCriteriaGroups(criteria, null, {
      block_id: block._id,
      resolveActualValue,
    });

    return {
      block_id: block._id,
      total_mark: totalBlockMark,
      block_result,
      subject_results: subjectResultsForBlock,
    };
  });

  return blockResults;
}

/**
 * Evaluates a single numeric comparison rule against a provided mark.
 * Supported operators include greater than, less than, equal, and their
 * inclusive variants. Returns the boolean outcome of the evaluation.
 *
 * Used as the core comparison logic in rule-based criteria evaluations,
 * typically for assessing score thresholds in subject/test logic.
 *
 * @function EvaluateRule
 * @param {number} mark - The actual score or mark to evaluate.
 * @param {string} operator - The comparison operator to apply.
 *                            Supported values: "GT", "GTE", "LT", "LTE", "EQ".
 * @param {number} value - The threshold value to compare against.
 *
 * @returns {boolean} `true` if the evaluation passes according to the operator;
 *                    `false` otherwise.
 *
 * @throws {AppError} If an invalid or unsupported operator is provided.
 *
 */
function EvaluateRule(mark, operator, value) {
  let conditionResult;

  switch (operator) {
    case "GT":
      conditionResult = mark > value;
      break;
    case "GTE":
      conditionResult = mark >= value;
      break;
    case "LT":
      conditionResult = mark < value;
      break;
    case "LTE":
      conditionResult = mark <= value;
      break;
    case "EQ":
      conditionResult = mark === value;
      break;
    default:
      throw CreateAppError(
        "Invalid operator in criteria rule",
        "INVALID_OPERATOR",
        { operator }
      );
  }

  return conditionResult;
}

/**
 * Evaluates a list of criteria groups and returns the expected_outcome
 * of the first group that matches the value. Only one group is allowed to pass.
 *
 * @param {Array<Object>} criteriaGroups - The criteria array (from test/subject/block)
 * @param {Number} actualValue - The numeric value to evaluate (e.g., average_mark)
 * @param {Object} meta - Additional metadata for error context (e.g., test_id)
 *
 * @returns {String} - expected_outcome of the first matching group (e.g., "PASS", "FAIL")
 *
 * @throws {CreateAppError} - If structure invalid or no group matches
 */
function EvaluateCriteriaGroups(criteriaGroups, actualValue, meta) {
  if (!Array.isArray(criteriaGroups) || criteriaGroups.length === 0) {
    throw CreateAppError(
      "Criteria group is missing or invalid",
      "INVALID_CRITERIA",
      meta
    );
  }

  let matchedOutcome = null;

  criteriaGroups.forEach((group, groupIndex) => {
    if (matchedOutcome) return;

    const { expected_outcome, rules } = group;

    if (!expected_outcome || typeof expected_outcome !== "string") {
      throw CreateAppError(
        "Missing or invalid expected_outcome",
        "INVALID_CRITERIA_GROUP",
        {
          groupIndex,
        }
      );
    }

    if (!Array.isArray(rules) || rules.length === 0) {
      throw CreateAppError(
        "Missing rules in criteria group",
        "INVALID_RULES_STRUCTURE",
        {
          groupIndex,
        }
      );
    }

    const evaluatedRules = rules.map((rule, ruleIndex) => {
      const { logical_operator, operator, value } = rule;

      if (
        ruleIndex === 0 &&
        logical_operator !== null &&
        logical_operator !== undefined
      ) {
        throw CreateAppError(
          `Rule[${ruleIndex}] in group[${groupIndex}] should not have logical_operator`,
          "INVALID_RULE_STRUCTURE",
          { groupIndex, ruleIndex }
        );
      }

      const valueToCheck = meta.resolveActualValue
        ? meta.resolveActualValue(rule)
        : actualValue;

      const result = EvaluateRule(
        valueToCheck,
        operator,
        value,
        expected_outcome
      );

      return { result, logical_operator, ruleIndex, type: rule.type };
    });

    if (evaluatedRules.length > 1) {
      AssertMixedOutcome(evaluatedRules, {
        index: groupIndex,
      });
    }

    const groupPass = evaluatedRules.reduce((oldResult, current, index) => {
      if (index === 0) return current.result;

      const logic = current.logical_operator;
      if (!logic) {
        throw CreateAppError(
          "Missing logical operator",
          "INVALID_LOGIC_CHAIN",
          {
            index: groupIndex,
            ruleIndex: current.ruleIndex,
          }
        );
      }

      if (logic === "AND") return oldResult && current.result;
      if (logic === "OR") return oldResult || current.result;

      throw CreateAppError("Invalid logical operator", "INVALID_LOGIC", {
        groupIndex,
        ruleIndex: current.ruleIndex,
        logical_operator: logic,
      });
    }, false);

    if (groupPass === true) {
      matchedOutcome = expected_outcome;
    }
  });
  if (!matchedOutcome) {
    throw CreateAppError(
      "No criteria group matched the value",
      "CRITERIA_NOT_MET",
      meta
    );
  }

  return matchedOutcome;
}

/**
 * Validates that a group of rule evaluations produces a mixed outcome
 * (at least one PASS and one FAIL), or that the group contains diverse
 * rule types to ensure semantic distinction. Throws an application-level
 * error if all outcomes are uniform and rule types are not diverse.
 *
 * This check prevents illogical rule configurations, such as rule groups
 * that produce only PASS or only FAIL outcomes, which would make the
 * grouping unnecessary or misleading.
 *
 * @function AssertMixedOutcome
 * @param {Array<Object>} results - Array of evaluated rule results.
 * @param {boolean} results[].result - The evaluation outcome (true for PASS, false for FAIL).
 * @param {string} results[].type - The rule type used for evaluation (used for semantic diversity check).
 * @param {Object} context - Additional error context to be passed to `CreateAppError`.
 *
 * @throws {AppError} If all outcomes are PASS or all are FAIL **and**
 *                    the group lacks rule type diversity.
 *
 */
function AssertMixedOutcome(results, context) {
  const resultList = results.map((result) => result.result);
  const hasPass = resultList.includes(true);
  const hasFail = resultList.includes(false);

  if (!hasPass || !hasFail) {
    const uniqueTypes = new Set(results.map((result) => result.type));
    if (uniqueTypes.size === 1) {
      throw CreateAppError(
        "Rule group must produce mixed PASS/FAIL result or contain diverse rule types",
        "UNIFORM_RULE_OUTCOME",
        context
      );
    }
  }
}

/**
 * Persist the final transcript calculation result for a student.
 *
 * @param {string} student_id - The ID of the student.
 * @param {Array<Object>} blockResults - The final evaluated block results.
 * @returns {Promise<void>} Resolves when the document is saved.
 */

async function CreateCalculationResult(student_id, blockResults) {
  const allBlockPass = blockResults.every(
    (block) => block.block_result === RESULT_PASS
  );

  const createCalculationResultPayload = {
    student_id,
    overall_result: allBlockPass ? RESULT_PASS : RESULT_FAIL,
    results: blockResults,
    calculation_result_status: CALCULATION_STATUS,
    created_at: new Date(),
  };

  const updateCalculationResultStudent = await CalculationResult.updateOne(
    {
      student_id,
      calculation_result_status: { $ne: STATUS_DELETED },
    },
    {
      $set: createCalculationResultPayload,
    },
    { upsert: true }
  );
  if (updateCalculationResultStudent.modifiedCount === 0) {
    throw CreateAppError(
      "Calculation Result not created or updated",
      "NOT_FOUND",
      {
        student_id,
      }
    );
  }

  TranscriptLogFile(student_id, createCalculationResultPayload);
  return createCalculationResultPayload;
}

/**
 * Return unique list of ObjectId strings
 *
 * @param {Array<any>} ids - List of ObjectId or strings
 * @returns {Array<string>} - Deduplicated string ids
 */
const UniqueIds = (ids) => [...new Set(ids.map(String))];

/**
 * Load subject documents from DB by a list of subject IDs
 *
 * @param {Array<string>} subjectIds - Array of subject ObjectId strings
 * @returns {Promise<Array<Object>>} - Array of subject documents
 * @throws {AppError} - If input is invalid or query fails
 */
async function LoadSubjectsByIds(subjectIds) {
  if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
    throw CreateAppError(
      "subjectIds must be a non-empty array",
      "BAD_REQUEST",
      {
        subject_id: subjectIds,
      }
    );
  }
  const rawSubjectIds = UniqueIds(subjectIds);

  const subjects = await Subject.find({
    _id: { $in: rawSubjectIds },
    subject_status: { $ne: STATUS_DELETED },
  }).lean();

  return subjects;
}
/**
 * Load block documents from DB by a list of block IDs
 *
 * @param {Array<string>} blockIds - Array of block ObjectId strings
 * @returns {Promise<Array<Object>>} - Array of block documents
 * @throws {AppError} - If input is invalid or query fails
 */
async function LoadBlocksByIds(blockIds) {
  if (!Array.isArray(blockIds) || blockIds.length === 0) {
    throw CreateAppError("blockIds must be a non-empty array", "BAD_REQUEST", {
      block_id: blockIds,
    });
  }
  const rawBlockIds = UniqueIds(blockIds);

  const blocks = await Block.find({
    _id: { $in: rawBlockIds },
    block_status: { $ne: STATUS_DELETED },
  }).lean();

  return blocks;
}

/**
 * Writes the transcript result to a JSON log file for debugging or auditing purposes.
 *
 * The file will be stored at: `logs/transcript_result/transcript_<studentId>.json`
 * If the directory does not exist, it will be created automatically.
 *
 * @param {string} studentId - The ID of the student whose transcript is being logged.
 * @param {Object} transcriptData - The full transcript calculation result to be saved.
 * @returns {void}
 *
 */
function TranscriptLogFile(studentId, transcriptData) {
  try {
    const logDir = path.resolve(__dirname, "../../logs/transcript_result/");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const filePath = path.join(logDir, `transcript_${studentId}.json`);
    fs.writeFileSync(
      filePath,
      JSON.stringify(transcriptData, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.warn("Unable to write transcript log file:", error.message);
  }
}

/**
 * Write worker-related logs into worker_error.log inside logs folder
 *
 * @param {string} logMessage - Message to be written to the log file
 */
function WriteWorkerLog(logMessage) {
  const timestamp = new Date().toISOString();
  const fullLog = `[${timestamp}] ${logMessage}\n`;

  try {
    const logDir = path.resolve(__dirname, "../../logs");
    const logFilePath = path.join(logDir, "worker_error.log");

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logFilePath, fullLog, "utf8");
  } catch (writeError) {
    console.error(
      "[WorkerLogWriteError] Failed to write log file.",
      writeError
    );
  }
}

// *************** EXPORT MODULE **************
module.exports = {
  RunTranscriptCore,
  FetchStudentTestResult,
  CalculateTestResults,
  CalculateSubjectResults,
  CalculateBlockResults,
  EvaluateRule,
  CreateCalculationResult,
  TranscriptLogFile,
  WriteWorkerLog,
};

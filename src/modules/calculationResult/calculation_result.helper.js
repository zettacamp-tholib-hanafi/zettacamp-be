// *************** IMPORT LIBRARY ***************
const { parentPort } = require("worker_threads");
const fs = require("fs");
const path = require("path");

// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT MODULE **************
const StudentTestResult = require("../studentTestResult/student_test_result.model");
const CalculationResult = require("../calculationResult/calculation_result.model");

// *************** IMPORT UTILS ***************
const { TimeNow } = require("../../shared/utils/time");
const { RoundFloat } = require("../../shared/utils/math");

const {
  LoadTestsByIds,
  LoadSubjectsByIds,
  LoadBlocksByIds,
} = require("./calculation_result.loader");

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

  const testIds = studentTestResults.map((result) => String(result.test_id));
  const tests = await LoadTestsByIds(testIds);
  if (!tests) {
    throw CreateAppError("Missing test", "DATA_MISSING");
  }

  const testResults = await CalculateTestResults(tests, studentTestResults);
  if (!testResults) {
    throw CreateAppError("Error calculate test result", "DATA_MISSING");
  }

  const subjectIds = tests.map((test) => String(test.subject_id));
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

  await CreateCalculationResult(student_id, blockResults);

  const sucessWorker = parentPort.postMessage({
    success: true,
    student_id,
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
  });

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
 * Evaluate test-level results with rule-based criteria.
 *
 * @param {Array<Object>} tests - Array of Test documents.
 * @param {Array<Object>} studentTestResults - Array of StudentTestResult documents.
 * @returns {Array<Object>} List of processed test evaluation results.
 */
async function CalculateTestResults(tests, studentTestResults) {
  const result = tests.map((test) => {
    const resultEntry = studentTestResults.find(
      (result) => String(result.test_id) === String(test._id)
    );

    if (!resultEntry) {
      throw CreateAppError(
        "No result found for test_id",
        "DATA_INTEGRITY_ERROR",
        {
          test_id: test._id,
        }
      );
    }

    const averageMark = RoundFloat(resultEntry.average_mark || 0);
    const weight = RoundFloat(test.weight || 0);
    const weightedMark = RoundFloat(averageMark * weight);

    const { logic, rules } = test.criteria || {};
    if (!logic || !Array.isArray(rules)) {
      throw CreateAppError("Invalid criteria format", "INVALID_CRITERIA", {
        test_id: test._id,
      });
    }

    const evaluations = rules.map((rule) => {
      const { operator, value, expected_outcome } = rule;
      const actual = EvaluateRule(averageMark, operator, value);
      return String(actual).toUpperCase() === expected_outcome;
    });

    let isPass = false;
    if (logic === "OR") {
      isPass = evaluations.some(Boolean);
    } else if (logic === "AND") {
      isPass = evaluations.every(Boolean);
    } else {
      throw CreateAppError("Invalid logic in criteria", "INVALID_LOGIC", {
        test_id: test._id,
        logic,
      });
    }

    return {
      test_id: test._id,
      subject_id: test.subject_id,
      average_mark: averageMark,
      weighted_mark: weightedMark,
      test_result: isPass ? RESULT_PASS : RESULT_FAIL,
    };
  });
  return result;
}

/**
 * Calculate subject results based on grouped test results and subject metadata.
 *
 * @param {Array<Object>} testResults - All student test results.
 * @param {Array<Object>} subjects - List of subject definitions with criteria and coefficient.
 * @returns {Array<Object>} - Subject result list with PASS/FAIL status and detailed info.
 */
function CalculateSubjectResults(testResults, subjects) {
  const resultCalculation = subjects.map((subject) => {
    const subjectId = String(subject._id);

    // *************** Get all test results for the current subject
    const relatedTestResults = testResults.filter((testResult) => {
      return String(testResult.subject_id) === subjectId;
    });

    // *************** Calculate total weighted mark
    const totalWeightedMark = relatedTestResults
      .map((testResult) => Number(testResult.weighted_mark || 0))
      .reduce((accumulator, current) => accumulator + current, 0);

    const coefficient = Number(subject.coefficient || 1);
    const totalMark = RoundFloat(coefficient * totalWeightedMark, 2);

    // *************** Evaluate all criteria rules
    const ruleEvaluations = subject.criteria.rules.map((rule) => {
      if (rule.type === "TEST_SCORE") {
        const matchingTest = relatedTestResults.find((testResult) => {
          return String(testResult.test_id) === String(rule.test_id);
        });
        const testScore = matchingTest
          ? Number(matchingTest.average_mark || 0)
          : 0;
        return EvaluateRule(testScore, rule.operator, rule.value);
      }

      if (rule.type === "AVERAGE") {
        return EvaluateRule(totalMark, rule.operator, rule.value);
      }

      return false;
    });

    const logicOperator = subject.criteria.logic || "AND";
    const passed =
      logicOperator === "AND"
        ? ruleEvaluations.every(Boolean)
        : ruleEvaluations.some(Boolean);

    return {
      subject_id: subject._id,
      block_id: subject.block_id,
      total_mark: totalMark,
      subject_result: passed ? RESULT_PASS : RESULT_FAIL,
      test_results: relatedTestResults,
    };
  });

  return resultCalculation;
}

/**
 * Calculate block results based on grouped subject results and block-level criteria.
 *
 * @param {Array<Object>} subjectResults - All subject result objects (includes test_results).
 * @param {Array<Object>} blocks - Array of block definitions with rules and logic.
 * @returns {Array<Object>} - Array of block result objects with evaluation outcome.
 */
async function CalculateBlockResults(subjectResults, blocks) {
  const blockResults = blocks.map((block) => {
    const blockId = String(block._id);

    // *************** Group subject results by block_id
    const subjectResultsForBlock = subjectResults.filter((subjectResult) => {
      return String(subjectResult.block_id) === blockId;
    });

    // *************** Compute average total_mark across all subjects in this block
    const totalMarksPerSubject = subjectResultsForBlock.map((subjectResult) =>
      Number(subjectResult.total_mark || 0)
    );

    const totalBlockMark =
      totalMarksPerSubject.length > 0
        ? RoundFloat(
            totalMarksPerSubject.reduce(
              (sum, subjectMark) => sum + subjectMark,
              0
            ) / totalMarksPerSubject.length,
            2
          )
        : 0;

    const { logic, rules } = block.criteria || {};
    if (!logic || !Array.isArray(rules)) {
      throw CreateAppError(
        "Invalid block criteria format",
        "INVALID_CRITERIA",
        {
          block_id: block._id,
        }
      );
    }

    // *************** Evaluate rules
    const ruleEvaluations = rules.map((rule) => {
      const { type, operator, value } = rule;

      // *************** Rule type: BLOCK_AVERAGE
      if (type === "BLOCK_AVERAGE") {
        return EvaluateRule(totalBlockMark, operator, value);
      }

      // *************** Rule type: SUBJECT_PASS_STATUS
      if (type === "SUBJECT_PASS_STATUS") {
        const matchingSubject = subjectResultsForBlock.find(
          (subjectResult) =>
            String(subjectResult.subject_id) === String(rule.subject_id)
        );
        if (!matchingSubject) return false;
        return matchingSubject.subject_result === RESULT_PASS;
      }

      // *************** Rule type: TEST_PASS_STATUS
      if (type === "TEST_PASS_STATUS") {
        const subjectWithMatchingTest = subjectResultsForBlock.find(
          (subjectResult) =>
            subjectResult.test_results.some(
              (testResult) =>
                String(testResult.test_id) === String(rule.test_id)
            )
        );
        if (!subjectWithMatchingTest) return false;

        const matchingTestResult = subjectWithMatchingTest.test_results.find(
          (testResult) => String(testResult.test_id) === String(rule.test_id)
        );
        return matchingTestResult?.test_result === RESULT_PASS;
      }

      return false;
    });

    // *************** Evaluate final block result based on logic
    let isBlockPass = false;
    if (logic === "AND") {
      isBlockPass = ruleEvaluations.every(Boolean);
    } else if (logic === "OR") {
      isBlockPass = ruleEvaluations.some(Boolean);
    } else {
      throw CreateAppError("Invalid block logic", "INVALID_LOGIC", {
        block_id: block._id,
        logic,
      });
    }

    // *************** Final block result object
    return {
      block_id: block._id,
      total_mark: totalBlockMark,
      block_result: isBlockPass ? RESULT_PASS : RESULT_FAIL,
      subject_results: subjectResultsForBlock,
    };
  });

  return blockResults;
}

/**
 * Evaluate a single rule condition.
 *
 * @param {number} mark - The average mark to evaluate.
 * @param {string} operator - Comparison operator.
 * @param {number} value - Threshold to compare with.
 * @returns {boolean} Evaluation result.
 */
function EvaluateRule(mark, operator, value) {
  switch (operator) {
    case "GT":
      return mark > value;
    case "GTE":
      return mark >= value;
    case "LT":
      return mark < value;
    case "LTE":
      return mark <= value;
    case "EQ":
      return mark === value;
    default:
      throw CreateAppError(
        "Invalid operator in criteria rule",
        "INVALID_OPERATOR",
        {
          operator,
        }
      );
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
    calculated_at: new Date(),
  };

  await CalculationResult.create(createCalculationResultPayload);

  await TranscriptLogFile(student_id, createCalculationResultPayload);
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

module.exports = {
  RunTranscriptCore,
  FetchStudentTestResult,
  CalculateTestResults,
  CalculateSubjectResults,
  CalculateBlockResults,
  EvaluateRule,
  CreateCalculationResult,
  TranscriptLogFile,
};

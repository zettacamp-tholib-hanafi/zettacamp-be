// *************** IMPORT LIBRARY ***************
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

// *************** IMPORT VALIDATOR **************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id");

// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT MODULE **************
const StudentTestResult = require("../studentTestResult/student_test_result.model");
const { ConnectDB, DisconnectDB } = require("../../core/db");
const { Loaders } = require("../../core/loader");

/**
 * RunTranscriptWorker
 * ------------------------------------------------------------------------------
 * Spawns a transcript calculation worker for the given student ID.
 * Resolves when the worker is successfully started (not when it finishes).
 *
 * @param {string} student_id - The ID of the student.
 * @returns {Promise<void>} Resolves when worker is spawned.
 */
function RunTranscriptWorker(student_id) {
  return new Promise(function (resolve, reject) {
    try {
      const worker = new Worker(__filename, {
        workerData: { student_id },
      });

      worker.once("online", function () {
        console.info("Transcript worker successfully spawned at : ", TimeNow());
        resolve();
      });

      worker.on("message", function (result) {
        console.info("Worker run successfully:", result);
      });

      worker.on("error", function (error) {
        console.error("Worker run error:", error);
      });

      worker.on("exit", function (code) {
        if (code !== 0) {
          console.error("Worker stopped with exit code", code);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

if (!isMainThread) {
  (async () => {
    try {
      await ConnectDB();
      const { student_id } = workerData;
      const studentId = await ValidateMongoId(student_id);

      await runTranscriptCore(studentId);

      parentPort.postMessage({
        success: true,
        student_id,
        message: `Transcript calculated successfully at ${TimeNow()}`,
      });
    } catch (error) {
      parentPort.postMessage({
        success: false,
        error: error.message || "Unknown Error in Transcript Worker",
      });
    } finally {
      DisconnectDB();
    }
  })();
}

/**
 * Execute transcript process logic.
 *
 * @param {ObjectId} student_id
 * @param {Object} loaders - Contains test, subject, and block DataLoaders
 * @returns {Promise<Object>} Transcript result
 */

async function runTranscriptCore(student_id) {
  const studentTestResults = await FetchStudentTestResult(student_id);
  if (!studentTestResults) {
    throw CreateAppError("Missing test result", "DATA_MISSING");
  }

  const testIds = studentTestResults.map((result) => String(result.test_id));
  const tests = await LoadTestsByIds(testIds);
  if (!tests) {
    throw CreateAppError("Missing test", "DATA_MISSING");
  }

  const testResults = CalculateTestResults(tests, studentTestResults);
  if (!testResults) {
    throw CreateAppError("Error calculate test result", "DATA_MISSING");
  }

  const subjectIds = tests.map((test) => String(test.subject_id));
  const subjects = await LoadSubjectsByIds(subjectIds);
  if (!subjects) {
    throw CreateAppError("Missing subject", "DATA_MISSING");
  }

  const subjectResults = CalculateSubjectResults(testResults, subjects);
  if (!subjectResults) {
    throw CreateAppError("Error calculate subject result", "DATA_MISSING");
  }

  const blockIds = subjects.map((subject) => String(subject.block_id));
  const blocks = await LoadBlocksByIds(blockIds);
  if (!blocks) {
    throw CreateAppError("Missing block", "DATA_MISSING");
  }

  return {
    studentTestResults,
    tests,
    subjects,
    blocks,
  };
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
    student_test_result_status: { $ne: "DELETED" },
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
 * @param {Array<ObjectId>} test_ids
 * @returns {Promise<Array>}
 */

async function LoadTestsByIds(test_ids) {
  const uniqueIds = [...new Set(test_ids.map(String))];
  return await Loaders.test.loadMany(uniqueIds);
}
/**
 * @param {Array<ObjectId>} subject_ids
 * @returns {Promise<Array>}
 */

async function LoadSubjectsByIds(subject_ids) {
  const uniqueIds = [...new Set(subject_ids.map(String))];
  return await Loaders.subject.loadMany(uniqueIds);
}

/**
 * @param {Array<ObjectId>} block_ids
 * @returns {Promise<Array>}
 */

async function LoadBlocksByIds(block_ids) {
  const uniqueIds = [...new Set(block_ids.map(String))];
  return await Loaders.block.loadMany(uniqueIds);
}

/**
 * Evaluate test-level results with rule-based criteria.
 *
 * @param {Array<Object>} tests - Array of Test documents.
 * @param {Array<Object>} studentTestResults - Array of StudentTestResult documents.
 * @returns {Array<Object>} List of processed test evaluation results.
 */
function CalculateTestResults(tests, studentTestResults) {
  const result = tests.map((test) => {
    const resultEntry = studentTestResults.find(
      (res) => String(res.test_id) === String(test._id)
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
      criteria: {
        logic,
        rules,
      },
      test_result: isPass ? "PASS" : "FAIL",
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
      criteria: subject.criteria,
      subject_result: passed ? "PASS" : "FAIL",
      test_results: relatedTestResults,
    };
  });

  return resultCalculation;
}

/**
 * Round a float number to a fixed number of decimal places.
 *
 * @param {number} value - The number to round.
 * @param {number} decimals - Number of digits after the decimal point.
 * @returns {number} Rounded float.
 */
function RoundFloat(value, decimals = 2) {
  if (typeof value !== "number") return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
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

function TimeNow() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// *************** EXPORT MODULE ***************
module.exports = {
  RunTranscriptWorker,
};

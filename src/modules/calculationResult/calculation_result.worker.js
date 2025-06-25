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
        console.log("Transcript worker successfully spawned at : ", TimeNow());
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
  const studentTestResults = await fetchStudentTestResult(student_id);
  if (!studentTestResults) {
    parentPort.postMessage({
      success: false,
      error: "Unknown Error in Transcript Worker",
    });
  }
  console.log("WORKER: studentTestResults: ", studentTestResults);

  const testIds = studentTestResults.map((result) => String(result.test_id));
  const tests = await loadTestsByIds(testIds);
  console.log("WORKER: testIds: ", tests);

  const subjectIds = tests.map((test) => String(test.subject_id));
  const subjects = await loadSubjectsByIds(subjectIds);
  console.log("WORKER: subjectIds: ", subjects);

  const blockIds = subjects.map((subject) => String(subject.block_id));
  const blocks = await loadBlocksByIds(blockIds);
  console.log("WORKER: blockIds: ", blocks);

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
async function fetchStudentTestResult(student_id) {
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

async function loadTestsByIds(test_ids) {
  const uniqueIds = [...new Set(test_ids.map(String))];
  console.log("Load : test:", uniqueIds);
  return await Loaders.test.loadMany(uniqueIds);
}
/**
 * @param {Array<ObjectId>} subject_ids
 * @returns {Promise<Array>}
 */

async function loadSubjectsByIds(subject_ids) {
  const uniqueIds = [...new Set(subject_ids.map(String))];
  console.log("Load : subject:", uniqueIds);
  return await Loaders.subject.loadMany(uniqueIds);
}

/**
 * @param {Array<ObjectId>} block_ids
 * @returns {Promise<Array>}
 */

async function loadBlocksByIds(block_ids) {
  const uniqueIds = [...new Set(block_ids.map(String))];
  console.log("Load : block:", uniqueIds);
  return await Loaders.block.loadMany(uniqueIds);
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

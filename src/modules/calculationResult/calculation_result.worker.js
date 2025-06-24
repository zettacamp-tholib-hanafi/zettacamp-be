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
const ConnectDB = require("../../core/db");

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

      const studentTestResult = await fetchStudentTestResult(studentId);
      if (!studentTestResult) {
        parentPort.postMessage({
          success: false,
          error: error.message || "Unknown Error in Transcript Worker",
        });
      }
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
    }
  })();
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

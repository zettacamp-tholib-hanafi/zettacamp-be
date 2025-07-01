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
const { ConnectDB, DisconnectDB } = require("../../core/db");

// *************** IMPORT UTILITIES ***************
const { TimeNow } = require("../../shared/utils/time");

// *************** IMPORT HELPER FUNCTION ***************
const {
  RunTranscriptCore,
  WriteWorkerLog,
} = require("./calculation_result.helper");

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
  try {
    const worker = new Worker(__filename, {
      workerData: { student_id },
    });

    worker.once("online", function () {
      console.info("Transcript worker successfully spawned at : ", TimeNow());
    });

    worker.on("message", function (result) {
      console.info("Worker run successfully:", result);
      if (result.success == false) {
        WriteWorkerLog(result.error);
      }
    });

    worker.on("error", function (error) {
      const errorMessage = `Worker run error: ${error}`;
      WriteWorkerLog(errorMessage);
      console.error("Worker run error:", errorMessage);
    });

    worker.on("exit", function (code) {
      if (code !== 0) {
        const errorMessage = `Worker stopped with exit code ${code}`;
        WriteWorkerLog(errorMessage);
        console.error(errorMessage);
      }
    });
  } catch (error) {
    WriteWorkerLog(error);
    console.error(error);
  }
}

if (!isMainThread) {
  (async () => {
    try {
      await ConnectDB();
      const { student_id } = workerData;
      const studentId = await ValidateMongoId(String(student_id));

      await RunTranscriptCore(studentId);
    } catch (error) {
      parentPort.postMessage({
        success: false,
        error: error.message || "Unknown Error in Transcript Worker",
      });
    } finally {
      await DisconnectDB();
    }
  })();
}

// *************** EXPORT MODULE ***************
module.exports = {
  RunTranscriptWorker,
};

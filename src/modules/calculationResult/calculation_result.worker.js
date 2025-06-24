// *************** IMPORT LIBRARY ***************
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

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

      console.log("WORKER");

      worker.once("online", function () {
        console.log("Transcript worker successfully spawned");
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
    const { student_id } = workerData;
    console.log("Worker start at: ", TimeNow());
    setTimeout(() => {
      parentPort.postMessage({
        success: true,
        student_id,
        message: `Transcript calculated successfully at ${TimeNow()}`,
      });
    }, 5000);
  })();
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

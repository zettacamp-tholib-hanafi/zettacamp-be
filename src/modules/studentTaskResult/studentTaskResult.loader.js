// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const StudentTaskResult = require("./studentTaskResult.model");

/**
 * Batches and returns Student Task Results by a list of IDs in the same order.
 *
 * This function retrieves multiple `StudentTaskResult` documents from the database
 * based on an array of IDs, then returns them in the **exact same order** as the input IDs.
 * If a specific ID is not found, the result at that index will be `undefined`.
 *
 * Commonly used with DataLoader to prevent N+1 query problems in GraphQL field resolvers.
 *
 * @async
 * @function BatchStudentTaskResultsById
 * @param {string[]} student_task_result_ids - Array of Student Task Result IDs to retrieve.
 *
 * @returns {Promise<(Object|undefined)[]>} Returns a Promise that resolves to an array of
 * `StudentTaskResult` documents matched by ID, maintaining the input order. Any missing IDs return `undefined`.
 */
async function BatchStudentTaskResultsById(student_task_result_ids) {
  const studentTaskResults = await StudentTaskResult.find({
    _id: { $in: student_task_result_ids },
  });

  return student_task_result_ids.map((id) =>
    studentTaskResults.find(
      (studentTaskResult) => String(studentTaskResult._id) === String(id)
    )
  );
}

// *************** LOADER ***************
function StudentTaskResultLoader() {
  return new DataLoader(BatchStudentTaskResultsById);
}

// *************** EXPORT MODULE ***************
module.exports = { StudentTaskResultLoader };

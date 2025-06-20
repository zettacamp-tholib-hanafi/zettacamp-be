// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const StudentTestResult = require("./student_test_result.model");

/**
 * Batches and returns Student Test Results by a list of IDs in the same order.
 *
 * This function retrieves multiple `StudentTestResult` documents from the database
 * based on an array of IDs, then returns them in the **exact same order** as the input IDs.
 * If a specific ID is not found, the result at that index will be `undefined`.
 *
 * Commonly used with DataLoader to prevent N+1 query problems in GraphQL field resolvers.
 *
 * @async
 * @function BatchStudentTestResultsById
 * @param {string[]} student_test_result_ids - Array of Student Test Result IDs to retrieve.
 *
 * @returns {Promise<(Object|undefined)[]>} Returns a Promise that resolves to an array of
 * `StudentTestResult` documents matched by ID, maintaining the input order. Any missing IDs return `undefined`.
 */
async function BatchStudentTestResultsById(student_test_result_ids) {
  const studentTestResults = await StudentTestResult.find({
    _id: { $in: student_test_result_ids },
  });

  const batchStudentTestResultResponse = student_test_result_ids.map((id) =>
    studentTestResults.find(
      (studentTestResult) => String(studentTestResult._id) === String(id)
    )
  );
  return batchStudentTestResultResponse;
}

// *************** LOADER ***************
function StudentTestResultLoader() {
  const studentTestResultLoaderResponse = new DataLoader(BatchStudentTestResultsById);
  return studentTestResultLoaderResponse;
}

// *************** EXPORT MODULE ***************
module.exports = { StudentTestResultLoader };

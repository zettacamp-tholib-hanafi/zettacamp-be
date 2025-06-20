// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const Student = require("./student.model");

/**
 * Batches students by their associated student IDs using a single database query.
 *
 * @async
 * @param {Array<string>} student_id - An array of student ObjectIds to group students by.
 * @returns {Promise<Array<Array<object>>>} A promise that resolves to an array of student arrays,
 * each sub-array containing students belonging to the corresponding school ID.
 */

async function BatchStudentsById(student_id) {
  const students = await Student.find({
    _id: { $in: student_id },
  });

  const batchStudentResponse = student_id.map((id) =>
    students.find((student) => String(student._id) === String(id))
  );
  return batchStudentResponse;
}

// *************** LOADER ***************
function StudentLoader() {
  const studentLoaderResponse = new DataLoader(BatchStudentsById);
  return studentLoaderResponse;
}

// *************** EXPORT MODULE ***************
module.exports = { StudentLoader };

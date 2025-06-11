// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const Student = require("./student.model");

/**
 * Batches students by their associated school IDs using a single database query.
 *
 * @async
 * @param {Array<string>} school_id - An array of school ObjectIds to group students by.
 * @returns {Promise<Array<Array<object>>>} A promise that resolves to an array of student arrays,
 * each sub-array containing students belonging to the corresponding school ID.
 */

async function BatchStudentsBySchoolId(school_id) {
  const students = await Student.find({
    school_id: { $in: school_id },
  });

  return school_id.map((id) =>
    students.filter((student) => student.school_id.toString() === id.toString())
  );
}

// *************** LOADER ***************
function StudentLoader() {
  return new DataLoader(BatchStudentsBySchoolId);
}

// *************** EXPORT MODULE ***************
module.exports = { StudentLoader };

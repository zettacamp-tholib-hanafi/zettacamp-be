// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const Student = require("./student.model");

// *************** Batch Load Function
const batchStudentsBySchoolId = async (school_id) => {
  // *************** Query Database Log
  console.info("[DataLoader] called with:", school_id);
  // *************** Find all students with the given school_id and not soft-deleted
  const students = await Student.find({
    school_id: { $in: school_id },
    deleted_at: null,
  });

  // *************** Return students grouped by school_id in the same order
  return school_id.map((id) =>
    students.filter((student) => student.school_id.toString() === id.toString())
  );
};

// *************** Create Student DataLoader
function studentLoader() {
  return new DataLoader(batchStudentsBySchoolId);
}

// *************** EXPORT MODULE ***************
module.exports = { studentLoader };

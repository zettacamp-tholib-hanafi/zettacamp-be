// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const School = require("./school.model");

// *************** Batch Load Function
const batchSchoolsById = async (school_id) => {
  // *************** Find all schools with the given id and not soft-deleted
  const schools = await School.find({
    _id: { $in: school_id },
    deleted_at: null,
  });

  // *************** Return schools in the same order as requested IDs
  return school_id.map(
    (id) =>
      schools.find((school) => school._id.toString() === id.toString()) || null
  );
};

// *************** LOADER ***************
function schoolLoader() {
  return new DataLoader(batchSchoolsById);
}

// *************** EXPORT MODULE ***************
module.exports = { schoolLoader };

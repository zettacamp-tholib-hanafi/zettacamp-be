// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const School = require("./school.model");

// *************** Batch Load Function
async function batchSchoolsById(school_id) {
  // *************** Find all schools with the given id
  const schools = await School.find({
    _id: { $in: school_id },
  });

  // *************** Return schools in the same order as requested IDs
  return school_id.map(
    (id) =>
      schools.find((school) => school._id.toString() === id.toString()) || null
  );
}

// *************** LOADER ***************
function schoolLoader() {
  return new DataLoader(batchSchoolsById);
}

// *************** EXPORT MODULE ***************
module.exports = { schoolLoader };

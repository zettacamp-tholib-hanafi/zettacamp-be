// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const Subject = require("./subject.model");

async function BatchSubjectsById(subject_id) {
  const subjects = await Subject.find({
    _id: { $in: subject_id },
  });

  return subject_id.map((id) =>
    subjects.find((subject) => String(subject._id) === String(id))
  );
}

// *************** LOADER ***************
function SubjectLoader() {
  return new DataLoader(BatchSubjectsById);
}

// *************** EXPORT MODULE ***************
module.exports = { SubjectLoader };

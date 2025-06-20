// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const Subject = require("./subject.model");

async function BatchSubjectsById(subject_id) {
  const subjects = await Subject.find({
    _id: { $in: subject_id },
  });

  const batchSubjectResponse = subject_id.map((id) =>
    subjects.find((subject) => String(subject._id) === String(id))
  );
  return batchSubjectResponse;
}

// *************** LOADER ***************
function SubjectLoader() {
  const subjectLoaderResponse = new DataLoader(BatchSubjectsById);
  return subjectLoaderResponse;
}

// *************** EXPORT MODULE ***************
module.exports = { SubjectLoader };

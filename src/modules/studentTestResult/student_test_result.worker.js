async function RunTranscriptWorker(student_id) {
  return console.log(
    "RunTranscriptWorker success with student_id:",
    student_id
  );
}

module.exports = {
  RunTranscriptWorker,
};

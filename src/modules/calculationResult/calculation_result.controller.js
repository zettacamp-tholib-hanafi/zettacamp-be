
function HandleTranscriptRequest(req, res) {
  res.json({
    student_id: req.params.student_id,
  });
}

// *************** EXPORT MODULE **************

module.exports = {
  HandleTranscriptRequest,
};

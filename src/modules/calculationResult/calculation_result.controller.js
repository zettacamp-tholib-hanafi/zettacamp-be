// *************** IMPORT MODULE **************
const CalculationResults = require("./calculation_result.model");

// *************** IMPORT LIBRARY **************
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

// *************** IMPORT UTILITIES ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id");

/**
 * HandleTranscriptRequest
 *
 * Handles an HTTP request to generate and return a student's final transcript as HTML.
 * Fetches published calculation results, populates related fields, compiles a Handlebars template,
 * and returns the rendered output.
 *
 * @async
 * @function
 * @param {import("express").Request} req - Express request object containing the student ID.
 * @param {import("express").Response} res - Express response object used to send the HTML or error response.
 * @returns {Promise<void>} Resolves with no return value; response is sent directly.
 */


async function HandleTranscriptRequest(req, res) {
  try {
    const studentId = await ValidateMongoId(
      req.params.student_id,
      "Student ID"
    );
    const query = {
      student_id: studentId,
      calculation_result_status: "PUBLISHED",
    };

    const calculationResultData = await CalculationResults.findOne(query)
      .populate({
        path: "results.block_id",
        select: "name",
      })
      .populate({
        path: "results.subject_results.subject_id",
        select: "name subject_code",
      })
      .populate({
        path: "results.subject_results.test_results.test_id",
        select: "name weight",
      })
      .lean();

    if (!calculationResultData) {
      return res.status(404).json({
        success: false,
        message: `CalculatioResult not found or already deleted`,
      });
    }

    const templatePath = path.join(__dirname, "templates", "transcript.hbs");
    if (!fs.existsSync(templatePath)) {
      return res
        .status(500)
        .json({ success: false, message: "Template file not found" });
    }
    const templateSource = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(templateSource);

    console.log(calculationResultData);

    const transcriptResult = template(calculationResultData);
    if (!transcriptResult) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to generate transcript" });
    }

    return res.status(200).send(transcriptResult);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: error.code || "USER_INPUT_ERROR",
      details: error.details || {},
    });
  }
}

// *************** EXPORT MODULE **************
module.exports = {
  HandleTranscriptRequest,
};

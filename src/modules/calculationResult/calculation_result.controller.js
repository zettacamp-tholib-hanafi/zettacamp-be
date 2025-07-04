// *************** IMPORT MODULE **************
const CalculationResult = require("./calculation_result.model");

// *************** IMPORT LIBRARY **************
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

// *************** IMPORT UTILITIES ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id");

/**
 * HandleTranscriptRequest
 *
 * Handles request to generate and return a student's transcript as rendered HTML.
 *
 * @async
 * @function
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @returns {Promise<void>} Sends rendered HTML or JSON error response.
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

    const calculationResultData = await CalculationResult.find(query).lean();

    if (!calculationResultData.length) {
      return res.status(404).json({
        success: false,
        message: `CalculatioResult not found or already deleted`,
      });
    }

    const templatePath = path.join(__dirname, "templates", "transcript.hbs");
    const templateSource = fs.readFileSync(templatePath, "utf8");

    const template = handlebars.compile(templateSource);

    const data = {
      name: "John Doe",
      age: 25,
      hobbies: ["Reading", "Gaming", "Hiking"],
    };

    if (!fs.existsSync(templatePath)) {
      return res
        .status(500)
        .json({ success: false, message: "Template file not found" });
    }

    const transcriptResult = template(data);
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

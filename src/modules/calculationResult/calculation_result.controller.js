// *************** IMPORT MODULE **************
const CalculationResult = require("./calculation_result.model");

// *************** IMPORT UTILITIES ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id");

/**
 * Handle HTTP request to retrieve a student's published transcript calculation results.
 *
 * ### Flow:
 * 1. Validates the `student_id` from the request URL using `ValidateMongoId`.
 * 2. Searches the `CalculationResult` collection for entries with:
 *    - Matching `student_id`
 *    - `calculation_result_status` equal to `"PUBLISHED"`
 * 3. If no results are found, responds with HTTP 404.
 * 4. If results exist, responds with HTTP 200 and the data.
 * 5. On error (validation or system), responds with HTTP 400 and structured error.
 *
 * @async
 * @function HandleTranscriptRequest
 * @param {import("express").Request} req - Express request object containing `student_id` in params.
 * @param {import("express").Response} res - Express response object used to send JSON result.
 * @returns {Promise<void>} Returns nothing, but sends HTTP response.
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
      res.status(404).json({
        success: false,
        message: `CalculatioResult not found or already deleted`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully get Calculation Result with student_id = ${studentId}`,
      data: calculationResultData,
    });
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

// *************** IMPORT MODULE **************
const CalculationResults = require("./calculation_result.model");

// *************** IMPORT UTILITIES ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id");
const { GeneratePDF } = require("./calculation_result.helper");

/**
 * HandleTranscriptRequest
 *
 * Generates a final transcript PDF for a specific student.
 *
 * @param {Object} request - Express request object
 * @param {Object} response - Express response object
 * @returns {Response} PDF stream as HTTP response
 */

async function HandleTranscriptRequest(request, response) {
  try {
    const studentId = await ValidateMongoId(
      request.params.student_id,
      "student_id"
    );

    const query = {
      student_id: studentId,
      calculation_result_status: "PUBLISHED",
    };

    const calculationResultData = await CalculationResults.findOne(
      query,
      "student_id results overall_result updated_at"
    )
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
        select: "name",
      })
      .lean();

    if (
      !calculationResultData ||
      !calculationResultData.results ||
      !Array.isArray(calculationResultData.results) ||
      calculationResultData.results.length === 0
    ) {
      return response.status(404).json({
        success: false,
        message: "CalculationResult not found or already deleted",
      });
    }

    const pdfResponse = await GeneratePDF(calculationResultData);

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `inline; filename=transcript-${studentId}.pdf`
    );
    response.setHeader("Content-Length", pdfResponse.length);

    return response.status(200).end(pdfResponse);
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error.message,
      code: error.code || "USER_INPUT_ERROR",
    });
  }
}

// *************** EXPORT MODULE **************
module.exports = {
  HandleTranscriptRequest,
};

// *************** IMPORT MODEL ***************
const CalculationResult = require("./calculation_result.model");

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id.js");

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

const VALID_CALCULATION_RESULT_STATUS = ["PUBLISHED", "ARCHIVED", "DELETED"];

// *************** QUERY ***************

/**
 * Retrieves all calculation results with optional filters.
 *
 * Supports filtering by student_id and calculation_result_status.
 *
 * @param {Object} _ - Unused root resolver argument.
 * @param {Object} args - GraphQL arguments.
 * @param {Object} args.filter - Filter input object.
 * @param {string} [args.filter.student_id] - The student ID to filter results by.
 * @param {string} [args.filter.calculation_result_status] - The status to filter results by.
 *
 * @returns {Promise<Array<Object>>} List of CalculationResult documents.
 *
 * @throws {AppError} If filter values are invalid.
 */
async function CalculationResults(_, args) {
  try {
    const query = {};

    const filter = args && args.filter ? args.filter : {};

    // *************** VALIDATE student_id
    if (filter.student_id) {
      const studentId = ValidateMongoId(filter.student_id, "filter.student_id");
      query.student_id = studentId;
    }

    // *************** VALIDATE calculation_result_status
    if (filter.calculation_result_status) {
      const status = filter.calculation_result_status;

      if (!VALID_CALCULATION_RESULT_STATUS.includes(status)) {
        throw CreateAppError(
          "Invalid calculation_result_status filter value",
          "BAD_REQUEST",
          { calculation_result_status: status }
        );
      }

      query.calculation_result_status = status;
    }

    const results = await CalculationResult.find(query);
    return results;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to get calculation results");
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    CalculationResults,
  },
};

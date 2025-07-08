// *************** IMPORT MODEL ***************
const CalculationResult = require("./calculation_result.model");

// *************** IMPORT VALIDATOR ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id.js");

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

// *************** IMPORT UTILITIES ***************
const { CALCULATION_RESULT } = require("../../shared/utils/enum.js");
const { RequireAuth } = require("../../shared/utils/require_auth.js");

// *************** QUERY ***************

/**
 * Retrieves a list of calculation results filtered by student ID and/or status.
 *
 * This resolver supports optional filtering based on:
 * - `student_id`: Must be a valid MongoDB ObjectId.
 * - `calculation_result_status`: Must match one of the allowed enum values in `CALCULATION_RESULT.VALID_STATUS`.
 *
 * If no filter is provided, it returns all existing calculation results that match the query.
 *
 * @param {Object} _ - GraphQL root resolver object (unused).
 * @param {Object} args - Arguments object from GraphQL.
 * @param {Object} args.filter - Optional filter input.
 * @param {string} [args.filter.student_id] - Optional student ID to filter results.
 * @param {string} [args.filter.calculation_result_status] - Optional calculation result status.
 *
 * @returns {Promise<Array<Object>>} List of calculation result documents that match the query.
 *
 * @throws {AppError} Throws a `BAD_REQUEST` error if `student_id` is invalid or `calculation_result_status` is not among allowed values.
 * @throws {AppError} Throws a generic error if fetching data from the database fails.
 */

async function CalculationResults(_, { filter = {} }, context) {
  try {
    RequireAuth(context);
    const query = {};

    if (filter.student_id) {
      const studentId = await ValidateMongoId(filter.student_id, "filter.student_id");
      query.student_id = studentId;
    }

    if (filter.calculation_result_status) {
      const status = filter.calculation_result_status;

      if (!CALCULATION_RESULT.VALID_STATUS.includes(status)) {
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

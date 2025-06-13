// *************** IMPORT MODULE ***************
const StudentTaskResult = require("./studentTaskResult.model.js");

// *************** IMPORT VALIDATOR ***************

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

// *************** Constant Enum
const VALID_STUDENT_TASK_RESULT_STATUS = [
  "GRADED",
  "PENDING_REVIEW",
  "NEEDS_CORRECTION",
  "DELETED",
];
const DEFAULT_STUDENT_TASK_RESULT_STATUS = "PENDING_REVIEW";

// *************** QUERY ***************

/**
 * Retrieves a list of student task results based on optional filters.
 *
 * Supports filtering by `student_task_result_status`, `student_id`, and `test_id`.
 * If no `student_task_result_status` is provided, it defaults to `PENDING_REVIEW`.
 * Each filter is validated and will throw an application error on invalid input.
 *
 * @async
 * @function GetAllStudentTaskResults
 * @param {Object} _ - Unused GraphQL root argument.
 * @param {Object} args - The arguments object containing optional filter criteria.
 * @param {Object} args.filter - Optional filters to apply to the query.
 * @param {string} [args.filter.student_task_result_status] - Filter by status (must be a valid enum).
 * @param {string} [args.filter.student_id] - Filter by student ID (must be a non-empty string).
 * @param {string} [args.filter.test_id] - Filter by test ID (must be a non-empty string).
 * @returns {Promise<Array<Object>>} Resolves to an array of matched student task result documents.
 * @throws {AppError} If any filter is invalid or if the database query fails.
 */
async function GetAllStudentTaskResults(_, { filter }) {
  try {
    const query = {};

    // *************** Filter: student_task_result_status
    if (filter && filter.student_task_result_status) {
      if (
        !VALID_STUDENT_TASK_RESULT_STATUS.includes(
          filter.student_task_result_status
        )
      ) {
        throw CreateAppError(
          "Invalid student_task_result_status filter value",
          "BAD_REQUEST",
          { student_task_result_status: filter.student_task_result_status }
        );
      }
      query.student_task_result_status = filter.student_task_result_status;
    } else {
      query.student_task_result_status = DEFAULT_STUDENT_TASK_RESULT_STATUS;
    }

    // *************** Filter: student_id
    if (filter && filter.student_id) {
      if (
        typeof filter.student_id !== "string" ||
        filter.student_id.trim() === ""
      ) {
        throw CreateAppError("Invalid student_id", "BAD_REQUEST", {
          student_id: filter.student_id,
        });
      }
      query.student_id = filter.student_id;
    }

    // *************** Filter: test_id
    if (filter && filter.test_id) {
      if (typeof filter.test_id !== "string" || filter.test_id.trim() === "") {
        throw CreateAppError("Invalid test_id", "BAD_REQUEST", {
          test_id: filter.test_id,
        });
      }
      query.test_id = filter.test_id;
    }

    return await StudentTaskResult.find(query);
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch student_task_results");
  }
}

/**
 * Retrieves a single student task result based on the provided filter criteria.
 *
 * Filters supported: `student_task_result_status`, `student_id`, and `test_id`.
 * If `student_task_result_status` is not provided, it defaults to `PENDING_REVIEW`.
 * Validates all filters and throws meaningful errors for invalid inputs.
 *
 * @async
 * @function GetOneStudentTaskResult
 * @param {Object} _ - Unused GraphQL root argument.
 * @param {Object} args - The arguments object containing the filter.
 * @param {Object} args.filter - Filter object to identify the student task result.
 * @param {string} [args.filter.student_task_result_status] - Optional status filter (must be a valid enum).
 * @param {string} [args.filter.student_id] - Required student ID (must be a non-empty string).
 * @param {string} [args.filter.test_id] - Required test ID (must be a non-empty string).
 * @returns {Promise<Object>} Resolves to the matched student task result document.
 * @throws {AppError} If any filter is invalid, the result is not found, or if the query fails.
 */

async function GetOneStudentTaskResult(_, { filter }) {
  try {
    const query = {};

    // *************** Filter: student_task_result_status
    if (filter && filter.student_task_result_status) {
      if (
        !VALID_STUDENT_TASK_RESULT_STATUS.includes(
          filter.student_task_result_status
        )
      ) {
        throw CreateAppError(
          "Invalid student_task_result_status filter value",
          "BAD_REQUEST",
          { student_task_result_status: filter.student_task_result_status }
        );
      }
      query.student_task_result_status = filter.student_task_result_status;
    } else {
      query.student_task_result_status = DEFAULT_STUDENT_TASK_RESULT_STATUS;
    }

    // *************** Filter: student_id
    if (filter && filter.student_id) {
      if (
        typeof filter.student_id !== "string" ||
        filter.student_id.trim() === ""
      ) {
        throw CreateAppError("Invalid student_id", "BAD_REQUEST", {
          student_id: filter.student_id,
        });
      }
      query.student_id = filter.student_id;
    }

    // *************** Filter: test_id
    if (filter && filter.test_id) {
      if (typeof filter.test_id !== "string" || filter.test_id.trim() === "") {
        throw CreateAppError("Invalid test_id", "BAD_REQUEST", {
          test_id: filter.test_id,
        });
      }
      query.test_id = filter.test_id;
    }
    const studentTaskResult = await StudentTaskResult.findOne(query);
    if (!studentTaskResult) {
      throw CreateAppError("StudentTaskResult not found", "NOT_FOUND", { id });
    }

    return studentTaskResult;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch student_task_results");
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllStudentTaskResults,
    GetOneStudentTaskResult,
  },
};

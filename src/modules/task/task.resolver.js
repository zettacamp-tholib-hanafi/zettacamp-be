// *************** IMPORT MODULE ***************
const Task = require("./task.model.js");

// *************** IMPORT VALIDATOR ***************

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

// *************** Constant Enum
const VALID_TASK_TYPES = ["ASSIGN_CORRECTOR", "ENTER_MARKS", "VALIDATE_MARKS"];

const VALID_TASK_STATUSES = ["PENDING", "PROGRESS", "COMPLETED", "DELETED"];

const DEFAULT_TASK_STATUS = "PENDING";

// *************** QUERY ***************
/**
 * GetAllTasks Resolver
 * ----------------------------------------------------------------
 * Fetches a list of tasks from the database with optional filtering
 * by task status, task type, test ID, and user ID. Performs strict
 * validation for each filter before querying the database.
 *
 * @param {Object} _ - Unused resolver parent argument.
 * @param {Object} args - GraphQL resolver arguments.
 * @param {Object} args.filter - Optional filter object to narrow down results.
 * @param {string} [args.filter.task_status] - Filter by task status (must be in VALID_TASK_STATUSES).
 * @param {string} [args.filter.task_type] - Filter by task type (must be in VALID_TASK_TYPES).
 * @param {string} [args.filter.test_id] - Filter by test ID (must be a non-empty string).
 * @param {string} [args.filter.user_id] - Filter by user ID (must be a non-empty string).
 *
 * @returns {Promise<Array<Object>>} List of task documents matching the filters.
 *
 * @throws {AppError} If any filter value is invalid or if the database query fails.
 */
async function GetAllTasks(_, { filter }) {
  try {
    const query = {};

    // *************** Filter: task_status
    if (filter && filter.task_status) {
      if (!VALID_TASK_STATUSES.includes(filter.task_status)) {
        throw CreateAppError(
          "Invalid task_status filter value",
          "BAD_REQUEST",
          { task_status: filter.task_status }
        );
      }
      query.task_status = filter.task_status;
    } else {
      query.task_status = DEFAULT_TASK_STATUS;
    }

    // *************** Filter: task_type
    if (filter && filter.task_type) {
      if (!VALID_TASK_TYPES.includes(filter.task_type)) {
        throw CreateAppError("Invalid task_type filter value", "BAD_REQUEST", {
          task_type: filter.task_type,
        });
      }
      query.task_type = filter.task_type;
    } else {
      query.task_type = DEFAULT_TASK_STATUS;
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
    // *************** Filter: user_id
    if (filter && filter.user_id) {
      if (typeof filter.user_id !== "string" || filter.user_id.trim() === "") {
        throw CreateAppError("Invalid user_id", "BAD_REQUEST", {
          user_id: filter.user_id,
        });
      }
      query.user_id = filter.user_id;
    }

    return await Task.find(query);
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch tasks");
  }
}
/**
 * GetOneTask Resolver
 * ----------------------------------------------------------------
 * Fetches a single task document based on its ID and optional filters
 * including task_status, task_type, test_id, and user_id. Validates
 * all input filters and returns the matched task if found.
 *
 * @param {Object} _ - Unused resolver parent argument.
 * @param {Object} args - GraphQL resolver arguments.
 * @param {Object} args.filter - Filter input object for task lookup.
 * @param {string} args.filter.id - ID of the task to retrieve (required).
 * @param {string} [args.filter.task_status] - Optional task status filter (must be in VALID_TASK_STATUSES).
 * @param {string} [args.filter.task_type] - Optional task type filter (must be in VALID_TASK_TYPES).
 * @param {string} [args.filter.test_id] - Optional test ID filter (non-empty string).
 * @param {string} [args.filter.user_id] - Optional user ID filter (non-empty string).
 *
 * @returns {Promise<Object>} Task document that matches the filter.
 *
 * @throws {AppError} If filter contains invalid values or task is not found.
 */

async function GetOneTask(_, { filter }) {
  try {
    const query = { _id: id };

    // *************** Filter: task_status
    if (filter && filter.task_status) {
      if (!VALID_TASK_STATUSES.includes(filter.task_status)) {
        throw CreateAppError(
          "Invalid task_status filter value",
          "BAD_REQUEST",
          { task_status: filter.task_status }
        );
      }
      query.task_status = filter.task_status;
    } else {
      query.task_status = DEFAULT_TASK_STATUS;
    }

    // *************** Filter: task_type
    if (filter && filter.task_type) {
      if (!VALID_TASK_TYPES.includes(filter.task_type)) {
        throw CreateAppError("Invalid task_type filter value", "BAD_REQUEST", {
          task_type: filter.task_type,
        });
      }
      query.task_type = filter.task_type;
    } else {
      query.task_type = DEFAULT_TASK_STATUS;
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
    // *************** Filter: user_id
    if (filter && filter.user_id) {
      if (typeof filter.user_id !== "string" || filter.user_id.trim() === "") {
        throw CreateAppError("Invalid user_id", "BAD_REQUEST", {
          user_id: filter.user_id,
        });
      }
      query.user_id = filter.user_id;
    }

    const task = await Task.findOne(query);
    if (!task) {
      throw CreateAppError("User not found", "NOT_FOUND", { id });
    }

    return task;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch tasks");
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllTasks,
    GetOneTask,
  },
};

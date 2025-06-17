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

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllTasks,
  },
};

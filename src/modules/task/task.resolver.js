// *************** IMPORT MODULE ***************
const Task = require("./task.model.js");
const Test = require("../test/test.model.js");
const StudentTestResult = require("../studentTestResult/student_test_result.model.js");
const Student = require("../student/student.model.js");
const User = require("../user/user.model.js");

// *************** IMPORT HELPER ***************
const { SendEmailViaSendGrid } = require("./task.helper.js");
// *************** IMPORT VALIDATOR ***************
const {
  ValidateCreateTask,
  ValidateUpdateTask,
  ValidateAssignCorrector,
  ValidateEnterMarks,
} = require("./task.validator.js");

// *************** IMPORT UTILS ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id.js");

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
    } 

    // *************** Filter: task_type
    if (filter && filter.task_type) {
      if (!VALID_TASK_TYPES.includes(filter.task_type)) {
        throw CreateAppError("Invalid task_type filter value", "BAD_REQUEST", {
          task_type: filter.task_type,
        });
      }
      query.task_type = filter.task_type;
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

    const taskResponse = await Task.find(query);
    return taskResponse;
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

async function GetOneTask(_, { id, filter }) {
  try {
    const taskId = await ValidateMongoId(id);

    const query = { _id: taskId };

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
    } 

    // *************** Filter: task_type
    if (filter && filter.task_type) {
      if (!VALID_TASK_TYPES.includes(filter.task_type)) {
        throw CreateAppError("Invalid task_type filter value", "BAD_REQUEST", {
          task_type: filter.task_type,
        });
      }
      query.task_type = filter.task_type;
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
      throw CreateAppError("Task not found", "NOT_FOUND", { taskId });
    }

    return task;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch tasks");
  }
}

// *************** MUTATION ***************

/**
 * CreateTask Resolver
 * ----------------------------------------------------------------
 * Creates a new Task document in the database after validating the input.
 * Ensures required fields (test_id, user_id, task_type) are present and
 * task_type/status are valid enum values. Automatically sets the due date
 * if provided.
 *
 * @param {Object} _ - Unused parent resolver argument (GraphQL convention).
 * @param {Object} args - GraphQL resolver arguments.
 * @param {Object} args.input - Input payload for creating a task.
 * @param {string} args.input.test_id - ID of the associated test (required).
 * @param {string} args.input.user_id - ID of the assigned user (required).
 * @param {string} args.input.task_type - Type of the task (e.g., ASSIGN_CORRECTOR, ENTER_MARKS).
 * @param {string} [args.input.task_status] - Optional task status (default: PENDING).
 * @param {Date|string} [args.input.due_date] - Optional due date.
 *
 * @returns {Promise<Object>} Newly created Task document.
 *
 * @throws {AppError} If validation fails or the database operation fails.
 */
async function CreateTask(_, { input }) {
  try {
    const { test_id, user_id, task_type, task_status, due_date } =
      await ValidateCreateTask(input);

    const taskInputPayload = {
      test_id,
      user_id,
      task_type,
      task_status,
      due_date,
    };

    const createTaskResponse = await Task.create(taskInputPayload);
    return createTaskResponse;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to create task", "VALIDATION_ERROR");
  }
}

/**
 * UpdateTask Resolver
 * ----------------------------------------------------------------
 * Updates an existing Task document in the database by `id`.
 * Validates the input fields using `ValidateUpdateTask`, constructs the
 * update payload, and applies the changes using `$set`. Returns the updated task's ID.
 *
 * @param {Object} _ - Unused parent resolver argument (GraphQL convention).
 * @param {Object} args - Arguments passed to the resolver.
 * @param {string} args.id - ID of the task to update.
 * @param {Object} args.input - Input payload for updating the task.
 * @param {string} args.input.test_id - ID of the test associated with the task.
 * @param {string} args.input.user_id - ID of the user assigned to the task.
 * @param {string} [args.input.task_type] - Task type (optional).
 * @param {string} [args.input.task_status] - Task status (optional).
 * @param {Date|string} [args.input.due_date] - Optional due date.
 *
 * @returns {Promise<Object>} An object containing the ID of the updated task: `{ id: string }`.
 *
 * @throws {AppError} If validation fails or the task does not exist.
 */
async function UpdateTask(_, { id, input }) {
  try {
    const { test_id, user_id, task_type, task_status, due_date } =
      await ValidateUpdateTask(input);
    const taskId = await ValidateMongoId(id);

    const taskUpdatePayload = {
      test_id,
      user_id,
      task_type,
      task_status,
      due_date,
    };

    const updated = await Task.updateOne(
      { _id: taskId },
      { $set: taskUpdatePayload }
    );

    if (!updated) {
      throw CreateAppError("Task not found", "NOT_FOUND", { taskId });
    }
    const updateTaskResponse = { id: taskId };
    return updateTaskResponse;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to update task", "VALIDATION_ERROR");
  }
}

/**
 * DeleteTask Resolver
 * ----------------------------------------------------------------
 * Soft deletes a Task by setting its `task_status` to `"DELETED"`,
 * along with `deleted_at` and `deleted_by` metadata. The operation is
 * skipped if the task is already marked as deleted.
 *
 * @param {Object} _ - Unused GraphQL resolver parent argument.
 * @param {Object} args - GraphQL resolver arguments.
 * @param {string} args.id - ID of the Task to be deleted.
 * @param {string} [args.deleted_by] - Optional user ID performing the deletion.
 *
 * @returns {Promise<Object>} An object containing the ID of the deleted task: `{ id: string }`.
 *
 * @throws {AppError} If the task is not found or already deleted.
 */

async function DeleteTask(_, { id, deleted_by }) {
  try {
    const taskId = await ValidateMongoId(id);

    const deleted = await Task.updateOne(
      {
        _id: taskId,
        task_status: { $ne: "DELETED" },
      },
      {
        $set: {
          task_status: "DELETED",
          deleted_at: new Date(),
          deleted_by: deleted_by ? deleted_by : null,
        },
      }
    );
    if (!deleted) {
      throw CreateAppError("Task not found or already deleted", "NOT_FOUND", {
        taskId,
      });
    }
    const deleteTaskResponse = { id: taskId };
    return deleteTaskResponse;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to delete task");
  }
}

/**
 * Assigns a corrector to a test and notifies them via email.
 *
 * @param {Object} _ - Unused GraphQL parent resolver parameter.
 * @param {Object} args - GraphQL arguments: { id, input }
 * @param {Object} context - GraphQL context, including models and user info.
 * @returns {String} - Success message if assignment and email succeed.
 */
async function AssignCorrector(_, { id, input }, context) {
  try {
    // *************** Step 1: Validate and fetch task
    const taskId = await ValidateMongoId(id);
    const { user_id, due_date, assignTask } = await ValidateAssignCorrector(
      taskId,
      input
    );

    // *************** Step 2: Mark AssignCorrector task as completed
    await Task.updateOne(
      {
        _id: assignTask._id,
        task_type: "ASSIGN_CORRECTOR",
        task_status: "PENDING",
      },
      {
        $set: {
          task_status: "COMPLETED",
        },
      }
    );

    // *************** Step 3: Create new task "ENTER_MARKS"
    await Task.create({
      test_id: assignTask.test_id,
      user_id,
      task_type: "ENTER_MARKS",
      task_status: "PENDING",
      due_date,
    });

    // *************** Step 4: Send Email Notification
    const test = await Test.findById(assignTask.test_id).lean();

    // *************** For testing purposes
    const corrector = {
      email: "usmanhanafit@gmail.com",
    };

    if (!test || !corrector) {
      throw new Error("Test or Corrector not found");
    }

    const students = await Student.find({ test_id: test._id })
      .select("first_name last_name")
      .lean();

    const studentNames = students
      .map((s) => `${s.first_name} ${s.last_name}`)
      .join(", ");
    const emailPayload = {
      to: corrector.email,
      subject: "You have been assigned as a Test Corrector!",
      html: `
    <h2>You have been assigned as a Test Corrector!</h2>
    <p><strong>Test:</strong> ${test.name}</p>
    <p><strong>Subject:</strong> ${test.subject_id}</p>
    <p><strong>Description:</strong> ${test.description || "-"}</p>
    <p><strong>Students to correct:</strong> ${studentNames}</p>
  `,
    };
    const sendEmailProcess = await SendEmailViaSendGrid(emailPayload);

    if (!sendEmailProcess) {
      throw new Error("Failed to send email notification");
    }

    const assignCorrectorResponse = { id: taskId };
    return assignCorrectorResponse;
  } catch (error) {
    throw HandleCaughtError(error);
  }
}

// *************** LOADER ***************

/**
 * test Field Resolver
 * ----------------------------------------------------------------
 * Resolves the `test` field for a Task object using DataLoader to batch and cache queries.
 *
 * @param {Object} parent - The parent Task object containing the `test_id`.
 * @param {Object} _ - Unused GraphQL args.
 * @param {Object} context - GraphQL context containing initialized DataLoaders.
 * @param {Object} context.loaders - The collection of DataLoaders.
 * @param {Object} context.loaders.test - DataLoader instance for batching Test lookups.
 *
 * @returns {Promise<Object|null>} A Promise that resolves to the Test object related to the Task, or `null` if not found.
 *
 * @throws {Error} If the Test loader is not properly initialized in the context.
 */

function test(parent, _, context) {
  if (!context && !context.loaders && !context.loaders.test) {
    throw new Error("School loader not initialized");
  }

  const testLoaderResponse = context.loaders.test.load(String(parent.test_id));
  return testLoaderResponse;
}

/**
 * user Field Resolver
 * ----------------------------------------------------------------
 * Resolves the `user` field for a Task object using DataLoader to efficiently fetch user data.
 *
 * @param {Object} parent - The parent Task object containing the `user_id`.
 * @param {Object} _ - Unused GraphQL args.
 * @param {Object} context - GraphQL context containing initialized DataLoaders.
 * @param {Object} context.loaders - The collection of DataLoaders.
 * @param {Object} context.loaders.user - DataLoader instance for batching User lookups.
 *
 * @returns {Promise<Object|null>} A Promise that resolves to the User object assigned to the Task, or `null` if not found.
 *
 * @throws {Error} If the User loader is not properly initialized in the context.
 */

function user(parent, _, context) {
  if (!context && !context.loaders && !context.loaders.users) {
    throw new Error("School loader not initialized");
  }

  const userLoaderResponse = context.loaders.user.load(String(parent.user_id));
  return userLoaderResponse;
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllTasks,
    GetOneTask,
  },
  Mutation: {
    CreateTask,
    UpdateTask,
    DeleteTask,
    AssignCorrector,
  },
  Task: {
    test,
    user,
  },
};

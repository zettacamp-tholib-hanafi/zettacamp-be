// *************** IMPORT MODULE ***************
const StudentTaskResult = require("./studentTaskResult.model.js");
const Task = require("../task/task.model.js");
const { Mutation } = require("../task/task.resolver.js");
// *************** IMPORT VALIDATOR ***************
const {
  ValidateCreateStudentTaskResult,
  ValidateUpdateStudentTaskResult,
} = require("./studentTaskResult.validator.js");
const { ValidateCreateTask } = require("../task/task.validator.js");

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

async function GetOneStudentTaskResult(_, { id, filter }) {
  try {
    const query = { _id: id };

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

// *************** MUTATION ***************
/**
 * Create a new StudentTaskResult record in the database.
 *
 * This mutation handles validation, average mark calculation, and timestamp assignment.
 * All marks are processed in the backend to ensure integrity and accurate grading metadata.
 *
 * @async
 * @function CreateStudentTaskResult
 * @param {Object} _ - Unused GraphQL root argument.
 * @param {Object} args - GraphQL arguments.
 * @param {Object} args.input - Input object containing student task result data.
 * @returns {Promise<Object>} The newly created StudentTaskResult document.
 * @throws {AppError} If validation fails or creation encounters errors.
 */

async function CreateStudentTaskResult(_, { input }) {
  try {
    const {
      student_id,
      test_id,
      marks,
      graded_by,
      remarks,
      student_task_result_status,
    } = await ValidateCreateStudentTaskResult(input);
    // *************** Calculate Average Mark
    let average_mark = 0;
    if (Array.isArray(marks) && marks.length > 0) {
      let total = 0;
      for (let i = 0; i < marks.length; i++) {
        total += marks[i].mark;
      }
      average_mark = total / marks.length;
    }

    const studentTaskResultPayload = {
      student_id,
      test_id,
      marks,
      average_mark,
      mark_entry_date: new Date(),
      graded_by: graded_by || null,
      remarks: remarks || null,
      student_task_result_status,
    };

    return await StudentTaskResult.create(studentTaskResultPayload);
  } catch (error) {
    throw HandleCaughtError(
      error,
      "Failed to create student_task_result",
      "VALIDATION_ERROR"
    );
  }
}

/**
 * UpdateStudentTaskResult
 * ------------------------------------------------------------------
 * Updates an existing student task result entry.
 * Validates the input using `ValidateUpdateStudentTaskResult`, recalculates
 * the average mark from the provided marks array, and persists the update.
 *
 * If the target `StudentTaskResult` document is not found, an error is thrown.
 * If any validation or database operation fails, it is handled gracefully.
 *
 * @async
 * @function UpdateStudentTaskResult
 *
 * @param {Object} _ - Unused GraphQL resolver root argument.
 * @param {Object} args - Arguments passed to the mutation.
 * @param {string} args.id - ID of the `StudentTaskResult` to update.
 * @param {Object} args.input - Input data to update the student task result.
 *
 * @throws {AppError} If validation fails, test is not found, or document is not found.
 * @throws {AppError} If any internal error occurs during the update process.
 *
 * @returns {Promise<Object>} Returns an object containing the updated ID.
 */

async function UpdateStudentTaskResult(_, { id, input }) {
  try {
    const {
      student_id,
      test_id,
      marks,
      graded_by,
      remarks,
      student_task_result_status,
    } = await ValidateUpdateStudentTaskResult(input);

    // *************** Calculate Average Mark
    let average_mark = 0;
    if (Array.isArray(marks) && marks.length > 0) {
      let total = 0;
      for (let i = 0; i < marks.length; i++) {
        total += marks[i].mark;
      }
      average_mark = total / marks.length;
    }

    const studentTaskResultPayload = {
      student_id,
      test_id,
      marks,
      average_mark,
      mark_entry_date: new Date(),
      graded_by: graded_by || null,
      remarks: remarks || null,
      student_task_result_status,
    };

    const updateStudentTaskResult = await StudentTaskResult.findOneAndUpdate(
      { _id: id },
      { $set: studentTaskResultPayload }
    );

    if (!updateStudentTaskResult) {
      throw CreateAppError("Student Task Result not found", "NOT_FOUND", {
        id,
      });
    }
    return { id };
  } catch (error) {
    throw HandleCaughtError(
      error,
      "Failed to create student_task_result",
      "VALIDATION_ERROR"
    );
  }
}

/**
 * Soft deletes a Student Task Result by marking its status as "DELETED".
 *
 * This function updates the `student_task_result_status` to `"DELETED"` and sets
 * the `deleted_at` timestamp and `deleted_by` user info. It only deletes records
 * that are not already deleted.
 *
 * @async
 * @function DeleteStudentTaskResult
 * @param {Object} _ - GraphQL parent resolver object (unused).
 * @param {Object} args - GraphQL arguments.
 * @param {string} args.id - The ID of the Student Task Result to delete.
 * @param {string} [args.deleted_by] - Optional ID of the user performing the deletion.
 *
 * @returns {Promise<Object>} Returns an object containing the ID of the deleted Student Task Result.
 *
 * @throws {AppError} Throws NOT_FOUND if the record does not exist or is already deleted.
 * @throws {AppError} Throws a general error with custom message if any other error occurs during deletion.
 */
async function DeleteStudentTaskResult(_, { id, deleted_by }) {
  try {
    const deleted = await StudentTaskResult.updateOne(
      { _id: id, student_task_result_status: { $ne: "DELETED" } },
      {
        $set: {
          student_task_result_status: "DELETED",
          deleted_at: new Date(),
          deleted_by: deleted_by ? deleted_by : null,
        },
      }
    );

    if (!deleted) {
      throw CreateAppError("Student Task Result not found", "NOT_FOUND", {
        id,
      });
    }

    return { id };
  } catch (error) {
    throw HandleCaughtError(error, "Failed to delete Student Task Result");
  }
}

async function EnterMarks(_, { input }) {
  try {
    const createStudentTaskResultPayload = {
      student_id: input.student_id,
      test_id: input.test_id,
      marks: input.marks,
      graded_by: input.graded_by,
      remarks: input.remarks,
      student_task_result_status: "GRADED",
    };
    const createStudentTaskResultProcess = await CreateStudentTaskResult(null, {
      input: createStudentTaskResultPayload,
    });

    // *************** Step 4: Mark ENTER_MARKS Task as Completed
    return console.log(
      "Step 4: Mark ENTER_MARKS Task as Completed",
      createStudentTaskResultProcess.test_id
    );
    await Task.updateOne(
      {
        test_id: createStudentTaskResultProcess.test_id,
        type: "ENTER_MARKS",
        status: "PENDING",
      },
      {
        $set: {
          status: "COMPLETED",
        },
      }
    );

    // *************** Step 5: Create VALIDATE_MARKS Task
    const createValidateMarkPayload = {
      task_type: "VALIDATE_MARKS",
      test_id: createStudentTaskResultProcess.test_id,
      user_id: createStudentTaskResultProcess.graded_by,
      due_date: createStudentTaskResultProcess.due_date || null,
      task_status: "PENDING",
    };
    const { test_id, user_id, task_type, task_status, due_date } =
      await ValidateCreateTask(createValidateMarkPayload);

    const taskInputPayload = {
      test_id,
      user_id,
      task_type,
      task_status,
      due_date,
    };

    return await Task.create(taskInputPayload);
  } catch (error) {
    return HandleCaughtError(
      error,
      "Failed to create Enter Marks",
      "VALIDATION_ERROR"
    );
  }
}

function student_id(parent, _, context) {
  if (!context && !context.loaders && !context.loaders.student) {
    throw new Error("School loader not initialized");
  }

  return context.loaders.student.load(String(parent.student_id));
}
function test_id(parent, _, context) {
  if (!context && !context.loaders && !context.loaders.test) {
    throw new Error("School loader not initialized");
  }

  return context.loaders.test.load(String(parent.test_id));
}
function graded_by(parent, _, context) {
  if (!context && !context.loaders && !context.loaders.users) {
    throw new Error("School loader not initialized");
  }

  return context.loaders.user.load(String(parent.graded_by));
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllStudentTaskResults,
    GetOneStudentTaskResult,
  },
  Mutation: {
    CreateStudentTaskResult,
    UpdateStudentTaskResult,
    DeleteStudentTaskResult,
    EnterMarks,
  },
  StudentTaskResult: {
    student: student_id,
    test: test_id,
    graded: graded_by,
  },
};

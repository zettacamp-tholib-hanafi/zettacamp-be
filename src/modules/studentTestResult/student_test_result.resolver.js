// *************** IMPORT MODULE ***************
const StudentTestResult = require("./student_test_result.model.js");
const Task = require("../task/task.model.js");
// *************** IMPORT VALIDATOR ***************
const {
  ValidateCreateStudentTestResult,
  ValidateUpdateStudentTestResult,
  ValidateValidateMarks,
} = require("./student_test_result.validator.js");
const { ValidateCreateTask } = require("../task/task.validator.js");

// *************** IMPORT UTILITIES ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id.js");

// *************** IMPORT CORE ****************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

// *************** IMPORT HELPER **************
const {
  RunTranscriptWorker,
} = require("../calculationResult/calculation_result.worker.js");

const VALID_STUDENT_TEST_RESULT_STATUS = [
  "GRADED",
  "PENDING_REVIEW",
  "NEEDS_CORRECTION",
  "DELETED",
];
const DEFAULT_STUDENT_TEST_RESULT_STATUS = "PENDING_REVIEW";

// *************** QUERY ***************

/**
 * Retrieves a list of student test results based on optional filters.
 *
 * Supports filtering by `student_test_result_status`, `student_id`, and `test_id`.
 * If no `student_test_result_status` is provided, it defaults to `PENDING_REVIEW`.
 * Each filter is validated and will throw an application error on invalid input.
 *
 * @async
 * @function GetAllStudentTestResults
 * @param {Object} _ - Unused GraphQL root argument.
 * @param {Object} args - The arguments object containing optional filter criteria.
 * @param {Object} args.filter - Optional filters to apply to the query.
 * @param {string} [args.filter.student_test_result_status] - Filter by status (must be a valid enum).
 * @param {string} [args.filter.student_id] - Filter by student ID (must be a non-empty string).
 * @param {string} [args.filter.test_id] - Filter by test ID (must be a non-empty string).
 * @returns {Promise<Array<Object>>} Resolves to an array of matched student test result documents.
 * @throws {AppError} If any filter is invalid or if the database query fails.
 */
async function GetAllStudentTestResults(_, { filter }) {
  try {
    const query = {};

    // *************** Filter: student_test_result_status
    if (filter && filter.student_test_result_status) {
      if (
        !VALID_STUDENT_TEST_RESULT_STATUS.includes(
          filter.student_test_result_status
        )
      ) {
        throw CreateAppError(
          "Invalid student_test_result_status filter value",
          "BAD_REQUEST",
          { student_test_result_status: filter.student_test_result_status }
        );
      }
      query.student_test_result_status = filter.student_test_result_status;
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

    const studentTestResultResponse = await StudentTestResult.find(query);
    return studentTestResultResponse;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch student_test_results");
  }
}

/**
 * Retrieves a single student test result based on the provided filter criteria.
 *
 * Filters supported: `student_test_result_status`, `student_id`, and `test_id`.
 * If `student_test_result_status` is not provided, it defaults to `PENDING_REVIEW`.
 * Validates all filters and throws meaningful errors for invalid inputs.
 *
 * @async
 * @function GetOneStudentTestResult
 * @param {Object} _ - Unused GraphQL root argument.
 * @param {Object} args - The arguments object containing the filter.
 * @param {Object} args.filter - Filter object to identify the student test result.
 * @param {string} [args.filter.student_test_result_status] - Optional status filter (must be a valid enum).
 * @param {string} [args.filter.student_id] - Required student ID (must be a non-empty string).
 * @param {string} [args.filter.test_id] - Required test ID (must be a non-empty string).
 * @returns {Promise<Object>} Resolves to the matched student test result document.
 * @throws {AppError} If any filter is invalid, the result is not found, or if the query fails.
 */

async function GetOneStudentTestResult(_, { id, filter }) {
  try {
    const studentTestResultId = await ValidateMongoId(id);

    const query = { _id: studentTestResultId };

    // *************** Filter: student_test_result_status
    if (filter && filter.student_test_result_status) {
      if (
        !VALID_STUDENT_TEST_RESULT_STATUS.includes(
          filter.student_test_result_status
        )
      ) {
        throw CreateAppError(
          "Invalid student_test_result_status filter value",
          "BAD_REQUEST",
          { student_test_result_status: filter.student_test_result_status }
        );
      }
      query.student_test_result_status = filter.student_test_result_status;
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
    const studentTestResult = await StudentTestResult.findOne(query);
    if (!studentTestResult) {
      throw CreateAppError("StudentTestResult not found", "NOT_FOUND", {
        studentTestResultId,
      });
    }

    return studentTestResult;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch student_test_results");
  }
}

// *************** MUTATION ***************
/**
 * Create a new StudentTestResult record in the database.
 *
 * This mutation handles validation, average mark calculation, and timestamp assignment.
 * All marks are processed in the backend to ensure integrity and accurate grading metadata.
 *
 * @async
 * @function CreateStudentTestResult
 * @param {Object} _ - Unused GraphQL root argument.
 * @param {Object} args - GraphQL arguments.
 * @param {Object} args.input - Input object containing student test result data.
 * @returns {Promise<Object>} The newly created StudentTestResult document.
 * @throws {AppError} If validation fails or creation encounters errors.
 */

async function CreateStudentTestResult(_, { input }) {
  try {
    const {
      student_id,
      test_id,
      marks,
      graded_by,
      remarks,
      student_test_result_status,
    } = await ValidateCreateStudentTestResult(input);
    // *************** Calculate Average Mark
    let average_mark = 0;
    if (Array.isArray(marks) && marks.length > 0) {
      const total = marks.reduce((sum, item) => sum + item.mark, 0);

      average_mark = total / marks.length;
    }

    const studentTestResultPayload = {
      student_id,
      test_id,
      marks,
      average_mark,
      mark_entry_date: new Date(),
      graded_by: graded_by || null,
      remarks: remarks || null,
      student_test_result_status,
    };

    const createStudentTaskResultResponse = await StudentTestResult.create(
      studentTestResultPayload
    );
    return createStudentTaskResultResponse;
  } catch (error) {
    throw HandleCaughtError(
      error,
      "Failed to create student_test_result",
      "VALIDATION_ERROR"
    );
  }
}

/**
 * UpdateStudentTestResult
 * ------------------------------------------------------------------
 * Updates an existing student test result entry.
 * Validates the input using `ValidateUpdateStudentTestResult`, recalculates
 * the average mark from the provided marks array, and persists the update.
 *
 * If the target `StudentTestResult` document is not found, an error is thrown.
 * If any validation or database operation fails, it is handled gracefully.
 *
 * @async
 * @function UpdateStudentTestResult
 *
 * @param {Object} _ - Unused GraphQL resolver root argument.
 * @param {Object} args - Arguments passed to the mutation.
 * @param {string} args.id - ID of the `StudentTestResult` to update.
 * @param {Object} args.input - Input data to update the student test result.
 *
 * @throws {AppError} If validation fails, test is not found, or document is not found.
 * @throws {AppError} If any internal error occurs during the update process.
 *
 * @returns {Promise<Object>} Returns an object containing the updated ID.
 */

async function UpdateStudentTestResult(_, { id, input }) {
  try {
    const {
      student_id,
      test_id,
      marks,
      graded_by,
      remarks,
      student_test_result_status,
    } = await ValidateUpdateStudentTestResult(input);
    const studentTestResultId = await ValidateMongoId(id);

    // *************** Calculate Average Mark
    let average_mark = 0;
    if (Array.isArray(marks) && marks.length > 0) {
      const total = marks.reduce((sum, item) => sum + item.mark, 0);
      average_mark = total / marks.length;
    }

    const studentTestResultPayload = {
      student_id,
      test_id,
      marks,
      average_mark,
      mark_entry_date: new Date(),
      graded_by: graded_by || null,
      remarks: remarks || null,
      student_test_result_status,
    };

    const updateStudentTestResult = await StudentTestResult.findOneAndUpdate(
      { _id: studentTestResultId },
      { $set: studentTestResultPayload }
    );

    if (!updateStudentTestResult) {
      throw CreateAppError("Student Test Result not found", "NOT_FOUND", {
        studentTestResultId,
      });
    }
    const updateStudentTestResultResponse = { id: studentTestResultId };
    return updateStudentTestResultResponse;
  } catch (error) {
    throw HandleCaughtError(
      error,
      "Failed to create student_test_result",
      "VALIDATION_ERROR"
    );
  }
}

/**
 * Soft deletes a Student Test Result by marking its status as "DELETED".
 *
 * This function updates the `student_test_result_status` to `"DELETED"` and sets
 * the `deleted_at` timestamp and `deleted_by` user info. It only deletes records
 * that are not already deleted.
 *
 * @async
 * @function DeleteStudentTestResult
 * @param {Object} _ - GraphQL parent resolver object (unused).
 * @param {Object} args - GraphQL arguments.
 * @param {string} args.id - The ID of the Student Test Result to delete.
 * @param {string} [args.deleted_by] - Optional ID of the user performing the deletion.
 *
 * @returns {Promise<Object>} Returns an object containing the ID of the deleted Student Test Result.
 *
 * @throws {AppError} Throws NOT_FOUND if the record does not exist or is already deleted.
 * @throws {AppError} Throws a general error with custom message if any other error occurs during deletion.
 */
async function DeleteStudentTestResult(_, { id, deleted_by }) {
  try {
    const studentTestResultId = await ValidateMongoId(id);
    const deleted = await StudentTestResult.updateOne(
      {
        _id: studentTestResultId,
        student_test_result_status: { $ne: "DELETED" },
      },
      {
        $set: {
          student_test_result_status: "DELETED",
          deleted_at: new Date(),
          deleted_by: deleted_by ? deleted_by : null,
        },
      }
    );

    if (!deleted) {
      throw CreateAppError("Student Test Result not found", "NOT_FOUND", {
        studentTestResultId,
      });
    }

    const deleteStudentTestResultResponse = { id: studentTestResultId };
    return deleteStudentTestResultResponse;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to delete Student Test Result");
  }
}

/**
 * Handle the EnterMarks mutation:
 * 1. Create a StudentTestResult
 * 2. Mark the ENTER_MARKS Task as COMPLETED
 * 3. Create a VALIDATE_MARKS Task for the same test
 *
 * @param {Object} _ - Unused root argument.
 * @param {Object} input - GraphQL input for EnterMarks.
 * @returns {Promise<Object>} - Object containing new StudentTestResult ID.
 */

async function EnterMarks(_, { input }) {
  try {
    const createStudentTestResultPayload = {
      student_id: input.student_id,
      test_id: input.test_id,
      marks: input.marks,
      graded_by: input.graded_by,
      remarks: input.remarks,
      student_test_result_status: "GRADED",
    };
    const createStudentTestResultProcess = await CreateStudentTestResult(null, {
      input: createStudentTestResultPayload,
    });

    const updatedTask = await Task.updateOne(
      {
        test_id: createStudentTestResultProcess.test_id,
        task_type: "ENTER_MARKS",
        task_status: "PENDING",
      },
      {
        $set: {
          task_status: "COMPLETED",
        },
      }
    );
    if (!updatedTask || updatedTask.modifiedCount === 0) {
      throw CreateAppError("Task not found or already completed", "NOT_FOUND", {
        test_id: createStudentTestResultProcess.test_id,
        task_type: "ENTER_MARKS",
      });
    }

    const createValidateMarkPayload = {
      task_type: "VALIDATE_MARKS",
      test_id: createStudentTestResultProcess.test_id,
      user_id: createStudentTestResultProcess.graded_by,
      due_date: createStudentTestResultProcess.due_date || null,
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

    const createTask = await Task.create(taskInputPayload);
    if (!createTask) {
      throw CreateAppError("Task not found or already completed", "NOT_FOUND", {
        test_id: createStudentTestResultProcess.test_id,
        task_type: "ENTER_MARKS",
      });
    }
    const enterMarksResponse = { id: createStudentTestResultProcess._id };
    return enterMarksResponse;
  } catch (error) {
    throw HandleCaughtError(
      error,
      "Failed to create Enter Marks",
      "VALIDATION_ERROR"
    );
  }
}
/**
 * Validate the marks of a student test result and complete the associated task.
 *
 * This function performs the following steps:
 * 1. Validates the given task ID using `ValidateMongoId`.
 * 2. Retrieves and validates the related task and student test result using `ValidateValidateMarks`.
 * 3. Updates the `mark_validated_date` in the `StudentTestResult` document.
 * 4. Marks the corresponding "VALIDATE_MARKS" task as "COMPLETED".
 * 5. Returns the ID of the validated `StudentTestResult`.
 *
 * If an error occurs during the process, it is handled by `HandleCaughtError`.
 *
 * @async
 * @function ValidateMarks
 * @param {object} _ - Unused GraphQL resolver parent argument.
 * @param {object} args - GraphQL arguments object.
 * @param {string} args.id - The task ID to validate and complete.
 * @returns {Promise<{id: string}>} Returns the ID of the validated student test result.
 *
 * @throws {AppError} If validation or update processes fail, returns an error wrapped by `HandleCaughtError`.
 */
async function ValidateMarks(_, { id }) {
  try {
    const taskId = await ValidateMongoId(id);
    const { task, studentTestResult } = await ValidateValidateMarks(taskId);

    const updateStudent = await StudentTestResult.updateOne(
      {
        _id: studentTestResult._id,
        student_test_result_status: { $ne: "DELETED" },
      },
      {
        $set: {
          mark_validated_date: new Date(),
        },
      }
    );
    if (updateStudent.modifiedCount === 0) {
      throw CreateAppError("Student Test Result not updated", "NOT_FOUND", {
        id: studentTestResult._id,
      });
    }

    const updateTask = await Task.updateOne(
      {
        _id: task._id,
        task_type: "VALIDATE_MARKS",
        task_status: "PENDING",
      },
      {
        $set: { task_status: "COMPLETED" },
      }
    );

    if (updateTask.modifiedCount === 0) {
      throw CreateAppError("Task not updated", "NOT_FOUND", {
        id: task._id,
      });
    }

    const student_id = await ValidateMongoId(
      String(studentTestResult.student_id)
    );
    if (student_id) {
      try {
        await RunTranscriptWorker(student_id);
      } catch (err) {
        throw CreateAppError("Transcript worker not started", "NOT_FOUND");
      }
    } else {
      throw CreateAppError(
        "[Transcript Worker] student_id is missing — worker not triggered",
        "NOT_FOUND"
      );
    }

    const validateMarksResponse = { id: studentTestResult._id };
    return validateMarksResponse;
  } catch (error) {
    throw HandleCaughtError(
      error,
      "Failed to Validate Marks",
      "VALIDATION_ERROR"
    );
  }
}

// *************** LOADER ***************
/**
 * Resolver function to load a student by their ID using DataLoader.
 *
 * @param {Object} parent - The parent object containing the student_id.
 * @param {Object} _ - Unused GraphQL arguments.
 * @param {Object} context - GraphQL context containing loaders.
 * @param {Object} context.loaders - Registry of DataLoader instances.
 * @param {DataLoader} context.loaders.student - DataLoader for students.
 *
 * @throws {Error} Throws an error if the student loader is not initialized.
 * @returns {Promise<Object>} Promise resolving to the student document.
 */

function student_id(parent, _, context) {
  if (!context && !context.loaders && !context.loaders.student) {
    throw new Error("School loader not initialized");
  }

  const studentIdLoaderResponse = context.loaders.student.load(
    String(parent.student_id)
  );
  return studentIdLoaderResponse;
}
/**
 * Resolver function to load a test by its ID using DataLoader.
 *
 * @param {Object} parent - The parent object containing the test_id.
 * @param {Object} _ - Unused GraphQL arguments.
 * @param {Object} context - GraphQL context containing loaders.
 * @param {Object} context.loaders - Registry of DataLoader instances.
 * @param {DataLoader} context.loaders.test - DataLoader for tests.
 *
 * @throws {Error} Throws an error if the test loader is not initialized.
 * @returns {Promise<Object>} Promise resolving to the test document.
 */

function test_id(parent, _, context) {
  if (!context && !context.loaders && !context.loaders.test) {
    throw new Error("School loader not initialized");
  }

  const testIdLoaderResponse = context.loaders.test.load(
    String(parent.test_id)
  );
  return testIdLoaderResponse;
}
/**
 * Resolver function to load the user who graded the test, using their ID.
 *
 * @param {Object} parent - The parent object containing the graded_by field.
 * @param {Object} _ - Unused GraphQL arguments.
 * @param {Object} context - GraphQL context containing loaders.
 * @param {Object} context.loaders - Registry of DataLoader instances.
 * @param {DataLoader} context.loaders.user - DataLoader for users.
 *
 * @throws {Error} Throws an error if the user loader is not initialized.
 * @returns {Promise<Object>} Promise resolving to the user document.
 */

function graded_by(parent, _, context) {
  if (!context && !context.loaders && !context.loaders.users) {
    throw new Error("School loader not initialized");
  }

  const gradedByLoaderResponse = context.loaders.user.load(
    String(parent.graded_by)
  );
  return gradedByLoaderResponse;
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllStudentTestResults,
    GetOneStudentTestResult,
  },
  Mutation: {
    CreateStudentTestResult,
    UpdateStudentTestResult,
    DeleteStudentTestResult,
    EnterMarks,
    ValidateMarks,
  },
  StudentTestResult: {
    student: student_id,
    test: test_id,
    graded: graded_by,
  },
};

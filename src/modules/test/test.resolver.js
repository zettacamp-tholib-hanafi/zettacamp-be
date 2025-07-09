// *************** IMPORT MODULE ***************
const Task = require("../task/task.model");
const Test = require("./test.model");

// *************** IMPORT VALIDATOR ***************
const {
  ValidateCreateTest,
  ValidateUpdateTest,
  ValidateAssignCorrector,
} = require("./test.validator.js");

// *************** IMPORT UTILITIES ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id.js");
const { TEST } = require("../../shared/utils/enum.js");
const { CheckRoleAccess } = require("../../shared/utils/check_role_access.js");

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

// *************** QUERY ***************

/**
 * Retrieves all test records from the database with optional filtering by test_status and grading_method.
 *
 * @param {Object} _ - Unused resolver root argument.
 * @param {Object} args - The arguments object containing filter options.
 * @param {Object} args.filter - Optional filter object to narrow down the results.
 * @param {string} [args.filter.test_status] - Optional status to filter tests (e.g., "DRAFT", "PUBLISHED").
 * @param {string} [args.filter.grading_method] - Optional grading method to filter tests (e.g., "MANUAL", "AUTO_GRADED").
 *
 * @returns {Promise<Array<Object>>} Returns a promise that resolves to an array of Test documents.
 *
 * @throws {AppError} Throws a BAD_REQUEST error if filter values are invalid.
 * @throws {AppError} Throws a general error if the query fails.
 */
async function GetAllTests(_, { filter }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    const query = {};

    if (filter && filter.test_status) {
      if (!TEST.VALID_STATUS.includes(filter.test_status)) {
        throw CreateAppError(
          "Invalid test_status filter value",
          "BAD_REQUEST",
          { test_status: filter.test_status }
        );
      }
      query.test_status = filter.test_status;
    }
    if (filter && filter.grading_method) {
      if (!TEST.VALID_GRADING_METHOD.includes(filter.grading_method)) {
        throw CreateAppError(
          "Invalid grading_method filter value",
          "BAD_REQUEST",
          { grading_method: filter.grading_method }
        );
      }
      query.grading_method = filter.grading_method;
    }

    const testResponse = await Test.find(query);
    return testResponse;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch tests");
  }
}

/**
 * Retrieves a single test record from the database based on optional filter criteria.
 *
 * @param {Object} _ - Unused resolver root argument.
 * @param {Object} args - Arguments containing filter conditions.
 * @param {Object} args.filter - Optional filter object to locate a specific test.
 * @param {string} [args.filter.test_status] - Optional test status to filter (e.g., "DRAFT", "PUBLISHED").
 * @param {string} [args.filter.grading_method] - Optional grading method to filter (e.g., "MANUAL", "AUTO_GRADED").
 *
 * @returns {Promise<Object>} Returns a promise that resolves to the found Test document.
 *
 * @throws {AppError} Throws BAD_REQUEST if filter contains invalid enum values.
 * @throws {AppError} Throws NOT_FOUND if no matching test is found.
 * @throws {AppError} Throws generic error if query operation fails.
 */
async function GetOneTest(_, { id, filter }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    const testId = await ValidateMongoId(id);

    const query = { _id: testId };

    if (filter && filter.test_status) {
      if (!TEST.VALID_STATUS.includes(filter.test_status)) {
        throw CreateAppError(
          "Invalid test_status filter value",
          "BAD_REQUEST",
          { test_status: filter.test_status }
        );
      }
      query.test_status = filter.test_status;
    } 
    if (filter && filter.grading_method) {
      if (!TEST.VALID_GRADING_METHOD.includes(filter.grading_method)) {
        throw CreateAppError(
          "Invalid grading_method filter value",
          "BAD_REQUEST",
          { grading_method: filter.grading_method }
        );
      }
      query.grading_method = filter.grading_method;
    }

    const test = await Test.findOne(query);
    if (!test) {
      throw CreateAppError("Test not found", "NOT_FOUND", { testId });
    }

    return test;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch tests");
  }
}

// *************** MUTATION ***************

/**
 * Create a new test based on validated input.
 *
 * @param {Object} _ - Unused GraphQL parent resolver argument.
 * @param {Object} args - The GraphQL arguments object.
 * @param {Object} args.input - The validated test creation input.
 * @returns {Promise<Object>} The created test document.
 */
async function CreateTest(_, { input }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    const {
      name,
      subject_id,
      description,
      weight,
      notations,
      total_score,
      grading_method,
      criteria,
      test_status,
      attachments,
      published_date,
    } = await ValidateCreateTest(input);

    const testPayload = {
      name,
      subject_id,
      description: description || null,
      weight,
      notations: Array.isArray(notations) ? notations : [],
      total_score,
      grading_method: grading_method || null,
      criteria,
      test_status,
      attachments: Array.isArray(attachments) ? attachments : [],
      published_date: published_date || null,
    };

    const createTestResponse = await Test.create(testPayload);
    return createTestResponse;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to create test", "VALIDATION_ERROR");
  }
}

/**
 * Update an existing test document.
 *
 * @param {Object} _ - Unused parent resolver argument.
 * @param {Object} args - GraphQL arguments.
 * @param {String} args.id - The ID of the test to update.
 * @param {Object} args.input - The validated update input.
 * @returns {Promise<Object>} The response containing updated test ID.
 */
async function UpdateTest(_, { id, input }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    const testId = await ValidateMongoId(id);

    const {
      name,
      subject_id,
      description,
      weight,
      notations,
      total_score,
      grading_method,
      criteria,
      test_status,
      attachments,
      published_date,
    } = await ValidateUpdateTest(testId, input);

    const testPayload = {
      name,
      subject_id,
      description: description || null,
      weight,
      notations: Array.isArray(notations) ? notations : [],
      total_score,
      grading_method: grading_method || null,
      criteria,
      test_status,
      attachments: Array.isArray(attachments) ? attachments : [],
      published_date: published_date || null,
    };

    const updated = await Test.updateOne(
      { _id: testId },
      { $set: testPayload }
    );

    if (!updated || updated.matchedCount === 0) {
      throw CreateAppError("Test not found", "NOT_FOUND", { testId });
    }

    const result = { id: testId };
    return result;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to update test", "VALIDATION_ERROR");
  }
}

/**
 * Soft deletes a Test by setting its `test_status` to "DELETED" and recording audit metadata.
 *
 * This mutation performs a soft delete by updating the `test_status` to `"DELETED"`,
 * and setting `deleted_at` to the current timestamp. It also stores the `deleted_by` user ID
 * if provided. If the test is already deleted or not found, it throws a `NOT_FOUND` error.
 *
 * @async
 * @function DeleteTest
 * @param {Object} _ - Unused parent resolver argument.
 * @param {Object} args - GraphQL resolver arguments.
 * @param {string} args.id - The ID of the test to delete.
 * @param {string} [args.deleted_by] - The user ID performing the deletion (optional).
 *
 * @returns {Promise<Object>} An object containing the `id` of the deleted test.
 *
 * @throws {AppError} Throws `NOT_FOUND` if the test is not found or already deleted.
 * @throws {AppError} Throws general error if the operation fails due to other reasons.
 */

async function DeleteTest(_, { id, deleted_by }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    const testId = await ValidateMongoId(id);

    const deleted = await Test.updateOne(
      {
        _id: testId,
        test_status: { $ne: "DELETED" },
      },
      {
        $set: {
          test_status: "DELETED",
          deleted_at: new Date(),
          deleted_by: deleted_by ? deleted_by : null,
        },
      }
    );

    if (!deleted) {
      throw CreateAppError("Test Not Found!", "NOT_FOUND", { testId });
    }

    const deleteTestResponse = { id: testId };
    return deleteTestResponse;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to delete test");
  }
}

/**
 * Publishes a test and assigns a corrector by creating an ASSIGN_CORRECTOR task.
 *
 * This function performs the following steps:
 * 1. Validates the corrector ID and due date via `ValidateAssignCorrector`.
 * 2. Updates the test status from "DRAFT" to "PUBLISHED" and sets `published_date`.
 * 3. Creates a new task of type `ASSIGN_CORRECTOR` with `PROGRESS` status for the corrector.
 *
 * @async
 * @function PublishTest
 * @param {object} _ - Unused parent resolver argument.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The ID of the test to publish.
 * @param {object} args.input - The input payload.
 * @param {string} args.input.corrector_id - The ID of the user to be assigned as corrector.
 * @param {string} [args.input.due_date] - Optional due date for the corrector's task.
 * @returns {Promise<{ id: string }>} - Returns an object containing the published test ID.
 * @throws {AppError} - Throws a custom application error if validation or any DB operation fails.
 */

async function PublishTest(_, { id, input }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    const testId = await ValidateMongoId(id);
    const { corrector, due_date } = await ValidateAssignCorrector(
      testId,
      input
    );

    // *************** Update Test to Published
    const publish_test = await Test.updateOne(
      { _id: testId, test_status: "DRAFT" },
      {
        $set: { test_status: "PUBLISHED", published_date: new Date() },
      }
    );

    if (!publish_test || publish_test.modifiedCount === 0) {
      throw CreateAppError("Failed to publish test", "INTERNAL_SERVER_ERROR");
    }

    // *************** Prepare Task Payload (assignCorrector)
    const assignCorrectorPayload = {
      test_id: testId,
      user_id: corrector._id,
      task_type: "ASSIGN_CORRECTOR",
      task_status: "PROGRESS",
      due_date: due_date ? new Date(due_date) : null,
    };

    await Task.create(assignCorrectorPayload);

    const publishTestResponse = { id: testId };
    return publishTestResponse;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to publish test");
  }
}

// *************** LOADER ***************

/**
 * Field resolver for fetching the subject associated with a test.
 *
 * This resolver uses a DataLoader (`context.loaders.subject`) to efficiently
 * load the subject related to a given test, based on `subject_id`.
 * It ensures that the loader is available in the context before attempting the lookup.
 *
 * @function subjects
 * @param {Object} test - The parent test object, typically returned by a higher-level resolver.
 * @param {Object} args - Unused in this resolver, included for GraphQL resolver signature compliance.
 * @param {Object} context - The GraphQL execution context, expected to contain `loaders.subject`.
 *
 * @throws {Error} If the `context`, `context.loaders`, or `context.loaders.subject` is not properly initialized.
 *
 * @returns {Promise<Object>} A promise that resolves to the subject document corresponding to `test.subject_id`.
 */

function subjects(test, args, context) {
  if (!context && !context.loaders && !context.loaders.test) {
    throw new Error("Test loader not initialized");
  }

  const subjectLoaderResponse = context.loaders.subject.load(
    String(test.subject_id)
  );
  return subjectLoaderResponse;
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllTests,
    GetOneTest,
  },
  Mutation: {
    CreateTest,
    UpdateTest,
    DeleteTest,
    PublishTest,
  },
  Test: {
    subject: subjects,
  },
};

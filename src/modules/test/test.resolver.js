// *************** IMPORT MODULE ***************
const Test = require("./test.model.js");

// *************** IMPORT VALIDATOR ***************
const { ValidateCreateTest } = require("./test.validator.js");

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

// *************** Constant Enum
const VALID_TEST_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED", "DELETED"];
const VALID_GRADING_METHOD = ["MANUAL", "AUTO_GRADED"];

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
async function GetAllTests(_, { filter }) {
  try {
    const query = {};

    if (filter && filter.test_status) {
      if (!VALID_TEST_STATUS.includes(filter.test_status)) {
        throw CreateAppError(
          "Invalid test_status filter value",
          "BAD_REQUEST",
          { test_status: filter.test_status }
        );
      }
      query.test_status = filter.test_status;
    } else {
      query.test_status = "ACTIVE";
    }
    if (filter && filter.grading_method) {
      if (!VALID_GRADING_METHOD.includes(filter.grading_method)) {
        throw CreateAppError(
          "Invalid grading_method filter value",
          "BAD_REQUEST",
          { grading_method: filter.grading_method }
        );
      }
      query.grading_method = filter.grading_method;
    }

    return await Test.find(query);
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
async function GetOneTest(_, { filter }) {
  try {
    const query = {};

    if (filter && filter.test_status) {
      if (!VALID_TEST_STATUS.includes(filter.test_status)) {
        throw CreateAppError(
          "Invalid test_status filter value",
          "BAD_REQUEST",
          { test_status: filter.test_status }
        );
      }
      query.test_status = filter.test_status;
    } else {
      query.test_status = "ACTIVE";
    }
    if (filter && filter.grading_method) {
      if (!VALID_GRADING_METHOD.includes(filter.grading_method)) {
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
      throw CreateAppError("Test not found", "NOT_FOUND", { id });
    }

    return test;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch tests");
  }
}

// *************** MUTATION ***************

/**
 * Creates a new Test entity in the database.
 *
 * This mutation validates the input payload using `ValidateCreateTest` and constructs
 * a properly structured test document for insertion into the database.
 * It handles optional fields like `description`, `passing_score`, `attachments`, and `published_date`
 * gracefully by defaulting to `null` or empty array as appropriate.
 *
 * On validation failure or DB errors, it throws a meaningful error via `HandleCaughtError`.
 *
 * @async
 * @function CreateTest
 * @param {Object} _ - Unused parent resolver argument.
 * @param {Object} args - GraphQL resolver arguments.
 * @param {Object} args.input - The input payload for creating a test.
 * @param {string} args.input.name - Name of the test (required).
 * @param {string} args.input.subject_id - MongoDB ObjectId string of the related subject (required).
 * @param {string} [args.input.description] - Optional description of the test.
 * @param {number} args.input.weight - Weight of the test (required, ≥ 0).
 * @param {Array<Object>} args.input.notations - Array of notation objects (required).
 * @param {number} args.input.total_score - Calculated total score from notations (required).
 * @param {string} [args.input.grading_method] - Optional grading method, must be 'MANUAL' or 'AUTO_GRADED'.
 * @param {number} [args.input.passing_score] - Optional minimum passing score.
 * @param {string} args.input.test_status - Status of the test, must be one of: DRAFT, PUBLISHED, ARCHIVED, DELETED.
 * @param {string[]} [args.input.attachments] - Optional array of valid URL strings.
 * @param {string} [args.input.published_date] - Optional ISO date string; only allowed if status is PUBLISHED.
 *
 * @returns {Promise<Object>} The created Test document.
 *
 * @throws {AppError} Throws if validation fails or database error occurs.
 */

async function CreateTest(_, { input }) {
  try {
    const {
      name,
      subject_id,
      description,
      weight,
      notations,
      total_score,
      grading_method,
      passing_score,
      test_status,
      attachments,
      published_date,
    } = await ValidateCreateTest(input);

    const testPayload = {
      name,
      subject_id,
      description: description ? description : null,
      weight,
      notations: Array.isArray(notations) ? notations : [],
      total_score,
      grading_method: grading_method ? grading_method : null,
      passing_score: passing_score ? passing_score : null,
      test_status,
      attachments: Array.isArray(attachments) ? attachments : [],
      published_date: published_date ? published_date : null,
    };

    return await Test.create(testPayload);
  } catch (error) {
    throw HandleCaughtError(error, "Failed to create test", "VALIDATION_ERROR");
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllTests,
    GetOneTest,
  },
  Mutation: {
    CreateTest,
  },
};

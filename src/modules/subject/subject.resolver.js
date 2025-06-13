// *************** IMPORT MODULE ***************
const Subject = require("./subject.model.js");

// *************** IMPORT VALIDATOR ***************

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");
const { ValidateCreateSubject } = require("./subject.validator.js");

const VALID_LEVEL = ["ELEMENTARY", "MIDDLE", "HIGH"];
const VALID_CATEGORY = ["CORE", "ELECTIVE", "SUPPORT"];
const VALID_STATUS = ["ACTIVE", "ARCHIVED", "DELETED"];

// *************** QUERY ***************

/**
 * Fetches all subjects from the database that match the optional filter criteria.
 *
 * Validates and applies the following filters:
 * - `subject_status`: must be one of ["ACTIVE", "ARCHIVED", "DELETED"]. Defaults to "ACTIVE" if not provided.
 * - `level`: must be one of ["ELEMENTARY", "MIDDLE", "HIGH"].
 * - `category`: must be one of ["CORE", "ELECTIVE", "SUPPORT"].
 * - `subject_id`: must be a non-empty string.
 *
 * Throws a `CreateAppError` if any filter value is invalid.
 * Returns a list of matching subject documents from the `Subject` collection.
 *
 * @async
 * @function GetAllSubject
 * @param {Object} _ - Parent resolver context (unused).
 * @param {Object} args - Resolver arguments.
 * @param {Object} args.filter - Optional filter object.
 * @param {string} [args.filter.subject_status] - Filter by subject status enum.
 * @param {string} [args.filter.level] - Filter by education level enum.
 * @param {string} [args.filter.category] - Filter by subject category enum.
 * @param {string} [args.filter.subject_id] - Filter by subject ID (string).
 *
 * @returns {Promise<Array<Object>>} List of subject documents matching the filters.
 *
 * @throws {AppError} If any filter is invalid or if the database operation fails.
 */

async function GetAllSubject(_, { filter }) {
  try {
    const query = {};

    // *************** Filter: subject_status
    if (filter && filter.subject_status) {
      if (!VALID_STATUS.includes(filter.subject_status)) {
        throw CreateAppError(
          "Invalid subject_status filter value",
          "BAD_REQUEST",
          { subject_status: filter.subject_status }
        );
      }
      query.subject_status = filter.subject_status;
    } else {
      // *************** Default to ACTIVE
      query.subject_status = "ACTIVE";
    }

    // *************** Filter: level
    if (filter && filter.level) {
      if (!VALID_LEVEL.includes(filter.level)) {
        throw CreateAppError("Invalid level filter value", "BAD_REQUEST", {
          level: filter.level,
        });
      }
      query.level = filter.level;
    }

    // *************** Filter: category
    if (filter && filter.category) {
      if (!VALID_CATEGORY.includes(filter.category)) {
        throw CreateAppError("Invalid category filter value", "BAD_REQUEST", {
          category: filter.category,
        });
      }
      query.category = filter.category;
    }

    // *************** Filter: subject_id
    if (filter && filter.subject_id) {
      if (
        typeof filter.subject_id !== "string" ||
        filter.subject_id.trim() === ""
      ) {
        throw CreateAppError("Invalid subject_id", "BAD_REQUEST", {
          subject_id: filter.subject_id,
        });
      }
      query.subject_id = filter.subject_id;
    }

    // *************** Execute query
    return await Subject.find(query);
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch subjects");
  }
}

/**
 * Fetches a single subject document from the database based on the provided filter criteria.
 *
 * Validates and applies the following filters:
 * - `subject_status`: must be one of ["ACTIVE", "ARCHIVED", "DELETED"]. Defaults to "ACTIVE" if not provided.
 * - `level`: must be one of ["ELEMENTARY", "MIDDLE", "HIGH"].
 * - `category`: must be one of ["CORE", "ELECTIVE", "SUPPORT"].
 * - `subject_id`: must be a non-empty string.
 *
 * If no subject is found matching the criteria, throws a `NOT_FOUND` error.
 * If any filter is invalid, throws a `BAD_REQUEST` error.
 *
 * @async
 * @function GetOneSubject
 * @param {Object} _ - Parent resolver context (unused).
 * @param {Object} args - Resolver arguments.
 * @param {Object} args.filter - Filter object to locate the subject.
 * @param {string} [args.filter.subject_status] - Filter by subject status enum.
 * @param {string} [args.filter.level] - Filter by education level enum.
 * @param {string} [args.filter.category] - Filter by subject category enum.
 * @param {string} [args.filter.subject_id] - Filter by subject ID (string).
 *
 * @returns {Promise<Object>} The subject document that matches the filters.
 *
 * @throws {AppError} If the subject is not found or any filter is invalid.
 */

async function GetOneSubject(_, { filter }) {
  try {
    const query = {};

    // *************** Filter: subject_status
    if (filter && filter.subject_status) {
      if (!VALID_STATUS.includes(filter.subject_status)) {
        throw CreateAppError(
          "Invalid subject_status filter value",
          "BAD_REQUEST",
          { subject_status: filter.subject_status }
        );
      }
      query.subject_status = filter.subject_status;
    } else {
      // *************** Default to ACTIVE
      query.subject_status = "ACTIVE";
    }

    // *************** Filter: level
    if (filter && filter.level) {
      if (!VALID_LEVEL.includes(filter.level)) {
        throw CreateAppError("Invalid level filter value", "BAD_REQUEST", {
          level: filter.level,
        });
      }
      query.level = filter.level;
    }

    // *************** Filter: category
    if (filter && filter.category) {
      if (!VALID_CATEGORY.includes(filter.category)) {
        throw CreateAppError("Invalid category filter value", "BAD_REQUEST", {
          category: filter.category,
        });
      }
      query.category = filter.category;
    }

    // *************** Filter: subject_id
    if (filter && filter.subject_id) {
      if (
        typeof filter.subject_id !== "string" ||
        filter.subject_id.trim() === ""
      ) {
        throw CreateAppError("Invalid subject_id", "BAD_REQUEST", {
          subject_id: filter.subject_id,
        });
      }
      query.subject_id = filter.subject_id;
    }

    // *************** Execute query
    const subject = await Subject.findOne(query);
    if (!subject) {
      throw CreateAppError("Subject not found", "NOT_FOUND", { id });
    }

    return subject;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch subjects");
  }
}

// *************** MUTATION ***************

/**
 * Creates a new Subject document in the database after validating the input.
 *
 * This resolver validates the provided input using `ValidateCreateSubject`,
 * then builds a sanitized payload for insertion into the database.
 * Returns the newly created subject document.
 *
 * @async
 * @function CreateSubject
 * @param {Object} _ - Parent resolver context (unused).
 * @param {Object} args - Resolver arguments.
 * @param {Object} args.input - Input data for creating a subject.
 *
 * @returns {Promise<Object>} The newly created Subject document.
 *
 * @throws {AppError} If input validation fails or creation fails.
 */
async function CreateSubject(_, { input }) {
  try {
    const {
      name,
      subject_code,
      description,
      level,
      category,
      block_id,
      coefficient,
      tests,
      subject_status,
    } = await ValidateCreateSubject(input);

    const subjectPayload = {
      name,
      subject_code,
      description: description ? description : null,
      level,
      category: category ? description : null,
      block_id,
      coefficient,
      tests: Array.isArray(tests) ? tests : [],
      subject_status,
    };

    return await Subject.create(subjectPayload);
  } catch (error) {
    throw HandleCaughtError(
      error,
      "Failed to create subject",
      "VALIDATION_ERROR"
    );
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllSubject,
    GetOneSubject,
  },
  Mutation: {
    CreateSubject,
  },
};

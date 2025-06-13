// *************** IMPORT MODULE ***************
const Subject = require("./subject.model.js");

// *************** IMPORT VALIDATOR ***************

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

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

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllSubject,
    GetOneSubject,
  },
};

// *************** IMPORT MODULE ***************
const Subject = require("./subject.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  ValidateCreateSubject,
  ValidateUpdateSubject,
} = require("./subject.validator.js");

// *************** IMPORT UTILS ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id.js");

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
 * @function GetAllSubjects
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

async function GetAllSubjects(_, { filter }) {
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
    const subjectResponse =  await Subject.find(query);
    return subjectResponse
  } catch (error) {
    const handlingError = HandleCaughtError(error, "Failed to fetch subjects");
    return handlingError;
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

async function GetOneSubject(_, { id, filter }) {
  try {
    const subjectId = await ValidateMongoId(id);

    const query = { _id: subjectId };

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
      const handlingError = CreateAppError("Subject not found", "NOT_FOUND", { subjectId });
      return handlingError;
    }

    return subject;
  } catch (error) {
    const handlingError = HandleCaughtError(error, "Failed to fetch subjects");
    return handlingError;
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

    const createSubjectResponse =  await Subject.create(subjectPayload);
    return createSubjectResponse
  } catch (error) {
    const handlingError =  HandleCaughtError(
      error,
      "Failed to create subject",
      "VALIDATION_ERROR"
    );
    return handlingError;
  }
}

/**
 * Updates an existing Subject document by its ID with the provided input data.
 *
 * This resolver validates and sanitizes the input using `ValidateUpdateSubject`,
 * builds the update payload, and performs an update operation on the Subject collection.
 *
 * If the subject is not found by the given `id`, it throws a NOT_FOUND error.
 * On validation or update failure, a meaningful error is raised and caught with `HandleCaughtError`.
 *
 * @async
 * @function UpdateSubject
 *
 * @param {Object} _ - Unused parent resolver argument (reserved by GraphQL spec).
 * @param {Object} args - Arguments passed to the resolver.
 * @param {string} args.id - The ID of the subject to update (must be a valid ObjectId).
 * @param {Object} args.input - The input object for the update.
 * @param {string} args.input.name - The updated subject name.
 * @param {string} args.input.subject_code - The updated subject code.
 * @param {string} [args.input.description] - Optional updated description.
 * @param {string} args.input.level - The updated subject level.
 * @param {string} [args.input.category] - Optional updated subject category.
 * @param {string} args.input.block_id - The associated block ID.
 * @param {number} args.input.coefficient - The subject coefficient.
 * @param {string[]} [args.input.tests] - Optional updated array of test IDs.
 * @param {string} [args.input.subject_status] - Optional subject status (defaults to ACTIVE).
 *
 * @returns {Promise<void>} Resolves on success, throws on failure. No return payload is expected.
 *
 * @throws {AppError} If input validation fails, subject not found, or database error occurs.
 */

async function UpdateSubject(_, { id, input }) {
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
    } = await ValidateUpdateSubject(input);
    const subjectId = await ValidateMongoId(id);

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

    const updated = await Subject.updateOne(
      { _id: subjectId },
      { $set: subjectPayload }
    );

    if (!updated) {
      throw CreateAppError("Subject not found", "NOT_FOUND", { subjectId });
    }
    const updateSubjectResponse = { id: subjectId };
    return updateSubjectResponse;
  } catch (error) {
    const handlingError = HandleCaughtError(
      error,
      "Failed to create subject",
      "VALIDATION_ERROR"
    );
    throw handlingError
  }
}

/**
 * Soft-deletes a subject by updating its `subject_status` to "DELETED".
 *
 * This function performs a soft delete operation on a subject by setting
 * `subject_status` to "DELETED", `deleted_at` to the current date, and
 * optionally `deleted_by` if provided.
 *
 * If the subject does not exist or is already deleted, an error is thrown.
 *
 * @async
 * @function DeleteSubject
 *
 * @param {Object} _ - Unused parent resolver argument (GraphQL standard).
 * @param {Object} args - Arguments passed to the resolver.
 * @param {string} args.id - The ID of the subject to soft delete.
 * @param {string} [args.deleted_by] - Optional user ID performing the deletion.
 *
 * @returns {Promise<Object>} An object containing the ID of the deleted subject.
 * @returns {string} returns.id - The ID of the soft-deleted subject.
 *
 * @throws {AppError} If the subject is not found or already deleted.
 * @throws {AppError} If a database or unexpected error occurs.
 */

async function DeleteSubject(_, { id, deleted_by }) {
  try {
    const subjectId = await ValidateMongoId(id);

    const deleted = await Subject.updateOne(
      { _id: subjectId, subject_status: { $ne: "DELETED" } },
      {
        $set: {
          subject_status: "DELETED",
          deleted_at: new Date(),
          deleted_by: deleted_by ? deleted_by : null,
        },
      }
    );

    if (!deleted) {
      throw CreateAppError("Subject not found", "NOT_FOUND", { subjectId });
    }

    const deleteSubjectResponse =  { id: subjectId };
    return deleteSubjectResponse;
  } catch (error) {
    const handlingError = HandleCaughtError(error, "Failed to delete subject");
    throw handlingError;
  }
}

// *************** LOADER ***************

/**
 * Resolves the `tests` field for a given subject using DataLoader for batching and caching.
 *
 * This resolver extracts test IDs from the `subject.tests` array and loads the corresponding
 * test documents efficiently using the `subject` DataLoader from the GraphQL context.
 *
 * @function tests
 * @param {Object} subject - The parent subject object containing the `tests` field (array of ObjectIds).
 * @param {Object} _ - Unused GraphQL argument placeholder.
 * @param {Object} context - GraphQL context object containing initialized DataLoaders.
 * @param {Object} context.loaders - Object containing all DataLoaders.
 * @param {Object} context.loaders.subject - DataLoader for batching and caching test fetches by ID.
 *
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of test objects related to the subject.
 *
 * @throws {Error} If the `context.loaders.subject` loader is not properly initialized.
 */

function tests(subject, _, context) {
  if (!context && !context.loaders && !context.loaders.subject) {
    throw new Error("Subject loader not initialized");
  }

  const subjectIds = subject.tests ? subject.tests.map((id) => String(id)) : [];
  const testLoaderResponse =  context.loaders.subject.loadMany(subjectIds);
  return testLoaderResponse;
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllSubjects,
    GetOneSubject,
  },
  Mutation: {
    CreateSubject,
    UpdateSubject,
    DeleteSubject,
  },
  Subject: {
    tests,
  },
};

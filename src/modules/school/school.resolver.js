// *************** IMPORT MODULE ***************
const School = require("./school.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  ValidateCreateSchoolInput,
  ValidateUpdateSchoolInput,
  ValidateAddress,
  ValidateContact,
  ValidateVerified,
  ValidateAdminUser,
} = require("./school.validator.js");

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

const VALID_STATUS = ["ACTIVE", "PENDING", "DELETED"];

// *************** QUERY ***************
/**
 * Get a list of schools based on an optional status filter.
 *
 * This resolver fetches all schools from the database. If a `school_status`
 * filter is provided, it will only return schools matching that status.
 * By default, it returns schools with `ACTIVE` status.
 *
 * @param {Object} _ - Unused parent resolver argument (per GraphQL convention).
 * @param {Object} args - Arguments passed to the query.
 * @param {Object} args.filter - Optional filter object.
 * @param {string} args.filter.school_status - Filter by school status (e.g., 'ACTIVE', 'PENDING', 'DELETED').
 *
 * @returns {Promise<Object[]>} A promise resolving to an array of School documents.
 */

async function GetAllSchools(_, { filter }) {
  try {
    const query = {};

    if (filter && filter.school_status) {
      if (!VALID_STATUS.includes(filter.school_status)) {
        throw CreateAppError(
          "Invalid school_status filter value",
          "BAD_REQUEST",
          { school_status: filter.school_status }
        );
      }
      query.school_status = filter.school_status;
    } else {
      query.school_status = "ACTIVE";
    }

    return await School.find(query);
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch schools");
  }
}

/**
 * Get a single school by its ID and optional status filter.
 *
 * This resolver fetches a single School document based on the provided ID.
 * If a `school_status` filter is specified, it will search using both ID and status.
 * If no filter is provided, it defaults to `ACTIVE` status.
 *
 * @param {Object} _ - Unused parent resolver argument (per GraphQL convention).
 * @param {Object} args - Arguments passed to the query.
 * @param {string} args.id - The ID of the school to retrieve.
 * @param {Object} [args.filter] - Optional filter object.
 * @param {string} [args.filter.school_status] - Filter by school status (e.g., 'ACTIVE', 'PENDING', 'DELETED').
 *
 * @returns {Promise<Object|null>} A promise resolving to the School document if found, or `null` if not found.
 */

async function GetOneSchool(_, { id, filter }) {
  try {
    const query = { _id: id };

    if (filter && filter.school_status) {
      if (!VALID_STATUS.includes(filter.school_status)) {
        throw CreateAppError(
          "Invalid school_status filter value",
          "BAD_REQUEST",
          { school_status: filter.school_status }
        );
      }
      query.school_status = filter.school_status;
    } else {
      query.school_status = "ACTIVE";
    }

    const school = await School.findOne(query);
    if (!school) {
      throw CreateAppError("School not found", "NOT_FOUND", { id });
    }

    return school;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch school");
  }
}

// *************** MUTATION ***************
/**
 * Create a new school with the given input data.
 *
 * This resolver handles input validation and persists a new School document
 * to the database. It includes structured fields such as `verified`, `address`,
 * `contact`, and `admin_user`. Defaults are applied where appropriate, including
 * timestamps for `created_at` and optional `updated_at`.
 *
 * @param {Object} _ - Unused parent resolver argument (per GraphQL convention).
 * @param {Object} args - Arguments passed to the mutation.
 * @param {Object} args.input - The input payload for creating a school.
 * @param {string} args.input.short_name - Short name of the school.
 * @param {string} args.input.long_name - Long name of the school.
 * @param {string} [args.input.logo_url] - URL of the school logo.
 * @param {Object[]} [args.input.verified] - Verification details.
 * @param {string} args.input.verified[].status_verified - Status of verification.
 * @param {string} args.input.verified[].verified_by - Verifier's ID or name.
 * @param {Date} args.input.verified[].verified_at - Date of verification.
 * @param {Object} [args.input.address] - Address details of the school.
 * @param {string} args.input.address.street_name - Street name.
 * @param {string} args.input.address.street_number - Street number.
 * @param {string} args.input.address.city - City name.
 * @param {string} args.input.address.state - State name.
 * @param {string} args.input.address.postal_code - Postal code.
 * @param {string} args.input.address.country - Country name.
 * @param {string} [args.input.address.address_line1] - Address line 1.
 * @param {string} [args.input.address.address_line2] - Address line 2.
 * @param {Object} [args.input.contact] - Contact information.
 * @param {string} args.input.contact.phone - School phone number.
 * @param {string} args.input.contact.email - School email address.
 * @param {string} [args.input.contact.website] - School website.
 * @param {Object[]} [args.input.admin_user] - List of admin users.
 * @param {string} args.input.admin_user[].id - User ID.
 * @param {string} args.input.admin_user[].role - Assigned role.
 * @param {Date} args.input.admin_user[].assigned_at - Assignment timestamp.
 * @param {string} args.input.school_status - Status of the school.
 * @param {string[]} [args.input.student_id] - Optional array of associated student IDs.
 * @param {Date} [args.input.deleted_at] - Deletion timestamp, if soft-deleted.
 * @param {string} [args.input.deleted_by] - User who marked as deleted.
 * @param {Date} [args.input.created_at] - Timestamp of creation (default: now).
 * @param {string} args.input.created_by - User who created the record.
 * @param {Date|null} [args.input.updated_at] - Optional update timestamp.
 * @param {string} [args.input.updated_by] - Optional user who last updated the record.
 *
 * @returns {Promise<Object>} A promise resolving to the newly created School document.
 */

async function CreateSchool(_, { input }) {
  try {
    ValidateCreateSchoolInput(input);
    ValidateVerified(input.verified);
    ValidateAddress(input.address);
    ValidateContact(input.contact);
    ValidateAdminUser(input.admin_user);

    const schoolInputPayload = {
      short_name: input.short_name,
      long_name: input.long_name,
      logo_url: input.logo_url,
      verified: input.verified
        ? input.verified.map((verified) => ({
            status_verified: verified.status_verified,
            verified_by: verified.verified_by,
            verified_at: verified.verified_at,
          }))
        : [],
      address: input.address
        ? {
            street_name: input.address.street_name,
            street_number: input.address.street_number,
            city: input.address.city,
            state: input.address.state,
            postal_code: input.address.postal_code,
            country: input.address.country,
            address_line1: input.address.address_line1,
            address_line2: input.address.address_line2,
          }
        : undefined,
      contact: input.contact
        ? {
            phone: input.contact.phone,
            email: input.contact.email,
            website: input.contact.website,
          }
        : undefined,
      admin_user: input.admin_user
        ? input.admin_user.map((user) => ({
            id: user.id,
            role: user.role,
            assigned_at: user.assigned_at,
          }))
        : [],
      school_status: input.school_status,
      student_id: input.student_id,
      deleted_at: input.deleted_at,
      deleted_by: input.deleted_by,
      created_at: input.created_at ? input.created_at : new Date(),
      created_by: input.created_by,
      updated_at: input.updated_at ? input.updated_at : null,
      updated_by: input.updated_by,
    };

    return await School.create(schoolInputPayload);
  } catch (error) {
    throw HandleCaughtError(
      error,
      "Failed to create school",
      "VALIDATION_ERROR"
    );
  }
}

/**
 * Updates an existing school in the database with new data.
 *
 * This function performs full validation of the input payload, including nested structures
 * such as `verified`, `address`, `contact`, and `admin_user`. It also constructs an update
 * payload based on the defined fields and updates the corresponding school document in MongoDB.
 *
 * @async
 * @function
 * @param {object} _ - GraphQL parent resolver argument (unused).
 * @param {object} args - Arguments object containing `id` and `input`.
 * @param {string} args.id - The ID of the school to be updated.
 * @param {object} args.input - Input data for updating the school.
 * @param {string} [args.input.short_name] - Short name of the school.
 * @param {string} [args.input.long_name] - Long name of the school.
 * @param {string} [args.input.logo_url] - URL of the school logo.
 * @param {Array<object>} [args.input.verified] - Verification status array.
 * @param {string} args.input.verified[].status_verified - Verification status.
 * @param {string} args.input.verified[].verified_by - ID of the verifier.
 * @param {Date} args.input.verified[].verified_at - Verification timestamp.
 * @param {object} [args.input.address] - School address details.
 * @param {string} args.input.address.street_name
 * @param {string} args.input.address.street_number
 * @param {string} args.input.address.city
 * @param {string} args.input.address.state
 * @param {string} args.input.address.postal_code
 * @param {string} args.input.address.country
 * @param {string} args.input.address.address_line1
 * @param {string} args.input.address.address_line2
 * @param {object} [args.input.contact] - School contact details.
 * @param {string} args.input.contact.phone
 * @param {string} args.input.contact.email
 * @param {string} args.input.contact.website
 * @param {Array<object>} [args.input.admin_user] - List of admin users assigned.
 * @param {string} args.input.admin_user[].id - User ID.
 * @param {string} args.input.admin_user[].role - Role of the admin.
 * @param {Date} args.input.admin_user[].assigned_at - Assignment timestamp.
 * @param {string} [args.input.school_status] - Status of the school.
 * @param {string} [args.input.student_id] - Linked student ID.
 * @param {Date} [args.input.deleted_at] - Soft delete timestamp.
 * @param {string} [args.input.deleted_by] - User who deleted the record.
 * @param {Date} [args.input.created_at] - Creation timestamp (optional override).
 * @param {string} [args.input.created_by] - Creator ID (optional override).
 * @param {Date} [args.input.updated_at] - Last updated timestamp (optional).
 * @param {string} args.input.updated_by - ID of the user who performed the update.
 *
 * @returns {Promise<object>} The updated school document.
 */

async function UpdateSchool(_, { id, input }) {
  try {
    ValidateUpdateSchoolInput(input);
    if (input.verified) ValidateVerified(input.verified);
    if (input.address) ValidateAddress(input.address);
    if (input.contact) ValidateContact(input.contact);
    if (input.admin_user) ValidateAdminUser(input.admin_user);

    const currentSchool = await School.findById(id);
    if (!currentSchool) {
      throw CreateAppError("School not found", "NOT_FOUND", { id });
    }

    const schoolUpdatePayload = {
      short_name: input.short_name,
      long_name: input.long_name,
      logo_url: input.logo_url,
      verified: input.verified
        ? input.verified.map((verified) => ({
            status_verified: verified.status_verified,
            verified_by: verified.verified_by,
            verified_at: verified.verified_at,
          }))
        : [],
      address: input.address
        ? {
            street_name: input.address.street_name,
            street_number: input.address.street_number,
            city: input.address.city,
            state: input.address.state,
            postal_code: input.address.postal_code,
            country: input.address.country,
            address_line1: input.address.address_line1,
            address_line2: input.address.address_line2,
          }
        : undefined,
      contact: input.contact
        ? {
            phone: input.contact.phone,
            email: input.contact.email,
            website: input.contact.website,
          }
        : undefined,
      admin_user: input.admin_user
        ? input.admin_user.map((user) => ({
            id: user.id,
            role: user.role,
            assigned_at: user.assigned_at,
          }))
        : [],
      school_status: input.school_status,
      student_id: input.student_id,
      deleted_at: input.deleted_at,
      deleted_by: input.deleted_by,
      created_at: input.created_at ? input.created_at : new Date(),
      created_by: input.created_by,
      updated_at: input.updated_at ? input.updated_at : null,
      updated_by: input.updated_by,
    };

    const updated = await School.updateOne(
      { _id: id },
      { $set: schoolUpdatePayload }
    );

    if (!updated) {
      throw CreateAppError("School not found", "NOT_FOUND", { id });
    }
    return { id };
  } catch (error) {
    throw HandleCaughtError(
      error,
      "Failed to update school",
      "VALIDATION_ERROR"
    );
  }
}

/**
 * Soft deletes a school by updating its status and deletion metadata.
 *
 * This function marks a school as deleted by setting `school_status` to `"DELETED"`,
 * and records `deleted_at` and `deleted_by` information. It uses a soft delete
 * strategy without removing the actual document from the database.
 *
 * @async
 * @function
 * @param {object} _ - GraphQL parent resolver argument (unused).
 * @param {object} args - Arguments object containing `id` and `input`.
 * @param {string} args.id - The ID of the school to be deleted.
 * @param {object} [args.input] - Optional input object.
 * @param {string} [args.input.deleted_by] - ID of the user who performed the deletion.
 *
 * @returns {Promise<object>} The soft-deleted school document.
 *
 * @throws {AppError} Throws an `AppError` with code `NOT_FOUND` if the school does not exist.
 * @throws {AppError} Throws a generic `AppError` if deletion fails due to a server or validation error.
 */

async function DeleteSchool(_, { id, input }) {
  try {
    const deleted = await School.updateOne(
      { _id: id, school_status: { $ne: "DELETED" } },
      {
        $set: {
          school_status: "DELETED",
          deleted_at: new Date(),
          deleted_by: input ? input.deleted_by : null,
        },
      }
    );

    if (!deleted) {
      throw CreateAppError("School not found", "NOT_FOUND", { id });
    }

    return { id };
  } catch (error) {
    throw HandleCaughtError(error, "Failed to delete school");
  }
}

/**
 * Resolver for fetching students associated with a school using DataLoader.
 *
 * This function retrieves all students related to the given school by using
 * the `student` DataLoader available in the GraphQL context. It ensures that
 * the loader is initialized before attempting to fetch the data.
 *
 * @param {Object} school - The parent school object containing the `_id` field.
 * @param {Object} _ - Unused GraphQL argument placeholder (args).
 * @param {Object} context - The GraphQL context object containing initialized loaders.
 * @param {Object} context.loaders - The loaders object from the context.
 * @param {DataLoader} context.loaders.student - The DataLoader instance for batching student queries.
 *
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of student objects related to the school.
 */

function students(school, _, context) {
  if (!context && !context.loaders && !context.loaders.student) {
    throw new Error("studentLoader loader not initialized");
  }

  return context.loaders.student.load(school._id.toString());
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllSchools,
    GetOneSchool,
  },
  Mutation: {
    CreateSchool,
    UpdateSchool,
    DeleteSchool,
  },
  School: {
    students,
  },
};

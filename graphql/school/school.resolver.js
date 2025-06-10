// *************** IMPORT MODULE ***************
const School = require("./school.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  validateCreateSchoolInput,
  validateUpdateSchoolInput,
  validateAddress,
  validateContact,
  validateVerified,
  validateAdminUser,
} = require("./school.validator.js");

// *************** IMPORT UTILITIES ***************
const {
  handleCaughtError,
  createAppError,
} = require("../../utils/ErrorFormat.js");

const VALID_STATUS = ["ACTIVE", "PENDING", "DELETED"];

// *************** QUERY ***************

// *************** Get all schools (default to ACTIVE only)
async function GetAllSchools(_, { filter }) {
  try {
    const query = {};

    if (filter && filter.school_status) {
      if (!VALID_STATUS.includes(filter.school_status)) {
        throw createAppError(
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
    throw handleCaughtError(error, "Failed to fetch schools");
  }
}

// *************** Get one school by ID (default to ACTIVE only)
async function GetOneSchool(_, { id, filter }) {
  try {
    const query = { _id: id };

    if (filter && filter.school_status) {
      if (!VALID_STATUS.includes(filter.school_status)) {
        throw createAppError(
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
      throw createAppError("School not found", "NOT_FOUND", { id });
    }

    return school;
  } catch (error) {
    throw handleCaughtError(error, "Failed to fetch school");
  }
}

// *************** MUTATION ***************

// *************** Create new School
async function CreateSchool(_, { input }) {
  try {
    validateCreateSchoolInput(input);
    validateVerified(input.verified);
    validateAddress(input.address);
    validateContact(input.contact);
    validateAdminUser(input.admin_user);

    const schoolInputPayload = {
      short_name: input.short_name,
      long_name: input.long_name,
      logo_url: input.logo_url,
      verified:
        input.verified?.map((verified) => ({
          status_verified: verified.status_verified,
          verified_by: verified.verified_by,
          verified_at: verified.verified_at,
        })) || [],
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
      admin_user:
        input.admin_user?.map((user) => ({
          id: user.id,
          role: user.role,
          assigned_at: user.assigned_at,
        })) || [],
      school_status: input.school_status,
      student_id: input.student_id,
      deleted_at: input.deleted_at,
      deleted_by: input.deleted_by,
      created_at: input.created_at || new Date(),
      created_by: input.created_by,
      updated_at: input.updated_at || null,
      updated_by: input.updated_by,
    };

    const school = new School(schoolInputPayload);
    return await school.save();
  } catch (error) {
    throw handleCaughtError(
      error,
      "Failed to create school",
      "VALIDATION_ERROR"
    );
  }
}

// *************** Update existing School
async function UpdateSchool(_, { id, input }) {
  try {
    validateUpdateSchoolInput(input);
    if (input.verified) validateVerified(input.verified);
    if (input.address) validateAddress(input.address);
    if (input.contact) validateContact(input.contact);
    if (input.admin_user) validateAdminUser(input.admin_user);

    const currentSchool = await School.findById(id);
    if (!currentSchool) {
      throw createAppError("School not found", "NOT_FOUND", { id });
    }

    const schoolUpdatePayload = {};

    if (input.short_name !== undefined) {
      schoolUpdatePayload.short_name = input.short_name;
    }
    if (input.long_name !== undefined) {
      schoolUpdatePayload.long_name = input.long_name;
    }
    if (input.logo_url !== undefined) {
      schoolUpdatePayload.logo_url = input.logo_url;
    }
    if (input.verified !== undefined) {
      schoolUpdatePayload.verified = input.verified.map((verified) => ({
        status_verified: verified.status_verified,
        verified_by: verified.verified_by,
        verified_at: verified.verified_at,
      }));
    }
    if (input.address !== undefined) {
      schoolUpdatePayload.address = {
        street_name: input.address.street_name,
        street_number: input.address.street_number,
        city: input.address.city,
        state: input.address.state,
        postal_code: input.address.postal_code,
        country: input.address.country,
        address_line1: input.address.address_line1,
        address_line2: input.address.address_line2,
      };
    }
    if (input.contact !== undefined) {
      schoolUpdatePayload.contact = {
        phone: input.contact.phone,
        email: input.contact.email,
        website: input.contact.website,
      };
    }
    if (input.admin_user !== undefined) {
      schoolUpdatePayload.admin_user = input.admin_user.map((user) => ({
        id: user.id,
        role: user.role,
        assigned_at: user.assigned_at,
      }));
    }
    if (input.school_status !== undefined) {
      schoolUpdatePayload.school_status = input.school_status;
    }
    if (input.student_id !== undefined) {
      schoolUpdatePayload.student_id = input.student_id;
    }
    if (input.deleted_at !== undefined) {
      schoolUpdatePayload.deleted_at = input.deleted_at;
    }
    if (input.deleted_by !== undefined) {
      schoolUpdatePayload.deleted_by = input.deleted_by;
    }
    if (input.created_at !== undefined) {
      schoolUpdatePayload.created_at = input.created_at;
    }
    if (input.created_by !== undefined) {
      schoolUpdatePayload.created_by = input.created_by;
    }

    schoolUpdatePayload.updated_at = input.updated_at || new Date();
    schoolUpdatePayload.updated_by = input.updated_by;

    const updated = await School.findOneAndUpdate(
      { _id: id },
      { $set: schoolUpdatePayload }
    );

    if (!updated) {
      throw createAppError("School not found", "NOT_FOUND", { id });
    }

    return updated;
  } catch (error) {
    throw handleCaughtError(
      error,
      "Failed to update school",
      "VALIDATION_ERROR"
    );
  }
}

// *************** Soft delete a school
async function DeleteSchool(_, { id, input }) {
  try {
    const deleted = await School.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          school_status: "DELETED",
          deleted_at: new Date(),
          deleted_by: input?.deleted_by || null,
        },
      }
    );

    if (!deleted) {
      throw createAppError("School not found", "NOT_FOUND", { id });
    }

    return deleted;
  } catch (error) {
    throw handleCaughtError(error, "Failed to delete school");
  }
}

// *************** Field resolver: Get all students in a school
function students(school, _, context) {
  if (!context?.loaders?.student) {
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

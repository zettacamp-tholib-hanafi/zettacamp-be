// *************** IMPORT MODULE ***************
const School = require("./school.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  validateCreateSchoolInput,
  validateUpdateSchoolInput,
} = require("./school.validator.js");

// *************** IMPORT ERROR HANDLER ***************
const { handleCaughtError } = require("../../utils/error.helper.js");

// *************** QUERY ***************

// *************** Get all schools (excluding soft-deleted)
const GetAllSchools = async () => {
  try {
    return await School.find({ deleted_at: null });
  } catch (error) {
    throw handleCaughtError(error, "Failed to fetch schools.");
  }
};

// *************** Get a specific school by ID (if not deleted)
const GetOneSchool = async (_, { id }) => {
  try {
    return await School.findOne({ _id: id, deleted_at: null });
  } catch (error) {
    throw handleCaughtError(error, "Failed to fetch school.");
  }
};

// *************** MUTATION ***************

// *************** Create new School
const CreateSchool = async (_, { input }) => {
  try {
    // *************** Validate input
    validateCreateSchoolInput(input);

    const school = new School(input);
    return await school.save();
  } catch (error) {
    throw handleCaughtError(error, "Failed to create school.");
  }
};

// *************** Update existing school by ID
const UpdateSchool = async (_, { id, input }) => {
  try {
    // *************** Validate input
    validateUpdateSchoolInput(input);

    return await School.findOneAndUpdate(
      { _id: id },
      { $set: input },
      { new: true }
    );
  } catch (error) {
    throw handleCaughtError(error, "Failed to update school.");
  }
};

// *************** Soft delete a school by ID
const DeleteSchool = async (_, { id }) => {
  try {
    return await School.findOneAndUpdate(
      { _id: id },
      { $set: { deleted_at: new Date() } },
      { new: true }
    );
  } catch (error) {
    throw handleCaughtError(error, "Failed to delete school.");
  }
};

// *************** Get all students in this school
const students = (school, _, context) => {
  // *************** Ensure DataLoader is initialized
  if (!context?.loaders?.student) {
    throw new Error("Student loader not initialized");
  }

  return context.loaders.student.load(school._id);
};

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
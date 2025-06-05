// *************** IMPORT MODULE ***************
const Student = require("./student.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  validateCreateStudentInput,
  validateUpdateStudentInput,
} = require("./student.validator.js");

// *************** IMPORT UTILITIES ***************
const {
  createAppError,
  handleCaughtError,
} = require("../../utils/error.helper.js");
const { SanitizeInput } = require("../../utils/SanitizeInput.js");

// *************** QUERY ***************

// *************** Get all students (excluding soft-deleted)
const GetAllStudents = async () => {
  try {
    return await Student.find({ deleted_at: null });
  } catch (error) {
    // *************** Handle unexpected error
    throw handleCaughtError(error, "Failed to retrieve students.");
  }
};

// *************** Get a specific student by ID (if not deleted)
const GetOneStudent = async (_, { id }) => {
  try {
    const student = await Student.findOne({ _id: id, deleted_at: null });
    if (!student) {
      // *************** If student is not found
      throw createAppError("Student not found.", "NOT_FOUND", { field: "id" });
    }
    return student;
  } catch (error) {
    // *************** Handle unexpected error
    throw handleCaughtError(error, "Failed to retrieve student.");
  }
};

// *************** MUTATION ***************

// *************** Create new student
const CreateStudent = async (_, { input }) => {
  try {
    // *************** Validate input payload
    validateCreateStudentInput(input);

    // *************** allowed input fields
    const allowedFields = [
      "first_name",
      "last_name",
      "email",
      "date_of_birth",
      "school_id",
    ];
    const studentInputSanitize = SanitizeInput(input, allowedFields);

    // *************** save to database
    const student = new Student(studentInputSanitize);
    return await student.save();
  } catch (error) {
    // *************** Handle creation error
    throw handleCaughtError(error, "Failed to create student.");
  }
};

// *************** Update existing student by ID
const UpdateStudent = async (_, { id, input }) => {
  try {
    // *************** Validate input payload
    validateUpdateStudentInput(input);

    // *************** allowed input fields
    const allowedFields = [
      "first_name",
      "last_name",
      "email",
      "date_of_birth",
      "school_id",
    ];
    const studentUpdateSanitize = SanitizeInput(input, allowedFields);

    // *************** update to database
    const updated = await Student.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { $set: studentUpdateSanitize },
      { new: true }
    );

    if (!updated) {
      // *************** If student not found or deleted
      throw createAppError(
        "Student not found or already deleted.",
        "NOT_FOUND",
        { field: "id" }
      );
    }

    return updated;
  } catch (error) {
    // *************** Handle update error
    throw handleCaughtError(error, "Failed to update student.");
  }
};

// *************** Soft delete a student by ID
const DeleteStudent = async (_, { id }) => {
  try {
    // *************** softdelete by adding deleted_at timestamp
    const deleted = await Student.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { $set: { deleted_at: new Date() } },
      { new: true }
    );

    if (!deleted) {
      // *************** If already deleted or not found
      throw createAppError(
        "Student not found or already deleted.",
        "NOT_FOUND",
        { field: "id" }
      );
    }

    return deleted;
  } catch (error) {
    // *************** Handle delete error
    throw handleCaughtError(error, "Failed to delete student.");
  }
};

// *************** Resolve school relation
const school = async (student, _, { loaders }) => {
  try {
    return await loaders.school.load(student.school_id.toString());
  } catch (error) {
    // *************** Handle loader error
    throw handleCaughtError(error, "Failed to load related school.");
  }
};

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllStudents,
    GetOneStudent,
  },
  Mutation: {
    CreateStudent,
    UpdateStudent,
    DeleteStudent,
  },
  Student: {
    school,
  },
};

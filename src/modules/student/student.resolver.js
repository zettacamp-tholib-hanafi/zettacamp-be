// *************** IMPORT MODULE ***************
const Student = require("./student.model.js");
const School = require("../school/school.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  ValidateCreateStudentInput,
  ValidateUpdateStudentInput,
} = require("./student.validator.js");

// *************** IMPORT UTILITIES ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id.js");
const { STUDENT } = require("../../shared/utils/enum.js");
const { CheckRoleAccess } = require("../../shared/utils/check_role_access.js");

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

// *************** QUERY ***************
/**
 * Retrieves all students with optional filtering by student_status.
 *
 * @async
 * @function GetAllStudents
 * @param {object} _ - Unused root resolver parameter.
 * @param {object} args - The arguments object.
 * @param {object} args.filter - Optional filter object.
 * @param {string} args.filter.student_status - Status to filter students (ACTIVE, PENDING, DELETED).
 * @returns {Promise<Array<object>>} List of students matching the filter.
 */

async function GetAllStudents(_, { filter }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    const query = {};

    if (filter) {
      if (filter.student_status) {
        if (!STUDENT.VALID_STATUS.includes(filter.student_status)) {
          throw CreateAppError(
            "Invalid student_status filter value",
            "BAD_REQUEST",
            { student_status: filter.student_status }
          );
        }
        query.student_status = filter.student_status;
      }
      if (filter.academic_status) {
        if (!STUDENT.VALID_ACADEMIC_STATUS.includes(filter.academic_status)) {
          throw CreateAppError(
            "Invalid academic_status filter value",
            "BAD_REQUEST",
            { academic_status: filter.academic_status }
          );
        }
        query.academic_status = filter.academic_status;
      }
      if (filter.gender) {
        if (!STUDENT.VALID_GENDER.includes(filter.gender)) {
          throw CreateAppError("Invalid gender filter value", "BAD_REQUEST", {
            gender: filter.gender,
          });
        }
        query.gender = filter.gender;
      }
    }

    const studentResponse = await Student.find(query);
    return studentResponse;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch students");
  }
}

/**
 * Retrieves a single student by ID with optional filtering by student_status.
 *
 * @async
 * @function GetOneStudent
 * @param {object} _ - Unused root resolver parameter.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The student ID.
 * @param {object} args.filter - Optional filter object.
 * @param {string} args.filter.student_status - Status to filter student (ACTIVE, PENDING, DELETED).
 * @returns {Promise<object>} The student object if found.
 */

async function GetOneStudent(_, { id, filter }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    const studentId = await ValidateMongoId(id);

    const query = { _id: studentId };

    if (filter) {
      if (filter.student_status) {
        if (!STUDENT.VALID_STATUS.includes(filter.student_status)) {
          throw CreateAppError(
            "Invalid student_status filter value",
            "BAD_REQUEST",
            { student_status: filter.student_status }
          );
        }
        query.student_status = filter.student_status;
      }
      if (filter.academic_status) {
        if (!STUDENT.VALID_ACADEMIC_STATUS.includes(filter.academic_status)) {
          throw CreateAppError(
            "Invalid academic_status filter value",
            "BAD_REQUEST",
            { academic_status: filter.academic_status }
          );
        }
        query.academic_status = filter.academic_status;
      }
      if (filter.gender) {
        if (!STUDENT.VALID_GENDER.includes(filter.gender)) {
          throw CreateAppError("Invalid gender filter value", "BAD_REQUEST", {
            gender: filter.gender,
          });
        }
        query.gender = filter.gender;
      }
    }

    const student = await Student.findOne(query);
    if (!student) {
      throw CreateAppError("Student not found", "NOT_FOUND", { studentId });
    }

    return student;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch student", "INTERNAL");
  }
}

// *************** MUTATION ***************
/**
 * Creates a new student after validating the input.
 *
 * @async
 * @function CreateStudent
 * @param {object} _ - Unused root resolver parameter.
 * @param {object} args - The arguments object.
 * @param {object} args.input - Input data for creating the student.
 * @returns {Promise<object>} The created student object.
 */

async function CreateStudent(_, { input }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    ValidateCreateStudentInput(input);

    const existing = await Student.findOne({ email: input.email });
    if (existing) {
      throw CreateAppError("Email is already in use", "DUPLICATE_FIELD", {
        field: "email",
      });
    }

    const studentInputPayload = {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone,
      profile_picture_url: input.profile_picture_url,
      school_id: input.school_id,
      student_number: input.student_number,
      gender: input.gender,
      birth: {
        place: input.birth.place,
        date: input.birth.date,
      },
      student_status: input.student_status,
      scholarship: input.scholarship,
      academic_status: input.academic_status,
      enrollment_date: input.enrollment_date,
      graduation_date: input.graduation_date,
      dropped_out_date: input.dropped_out_date,
      transferred_date: input.transferred_date,
    };
    const createStudentProcess = await Student.create(studentInputPayload);
    if (createStudentProcess) {
      await School.updateOne(
        { _id: createStudentProcess.school_id },
        {
          $addToSet: {
            students: [createStudentProcess._id],
          },
        }
      );
    } else {
      throw CreateAppError("Failed to create student", "CREATE_FAILED");
    }
    return createStudentProcess;
  } catch (error) {
    throw HandleCaughtError(
      error,
      "Failed to create student",
      "VALIDATION_ERROR"
    );
  }
}

/**
 * Updates an existing student by ID after validating the input.
 *
 * @async
 * @function UpdateStudent
 * @param {object} _ - Unused root resolver parameter.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The ID of the student to update.
 * @param {object} args.input - Input data for updating the student.
 * @returns {Promise<object>} The updated student object.
 */

async function UpdateStudent(_, { id, input }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    ValidateUpdateStudentInput(input);
    const studentId = await ValidateMongoId(id);

    const currentStudent = await Student.findById(studentId);
    if (!currentStudent) {
      throw CreateAppError("Student not found", "NOT_FOUND", { studentId });
    }

    if (input.email && input.email !== currentStudent.email) {
      const existing = await Student.findOne({ email: input.email });
      if (existing) {
        throw CreateAppError("Email is already in use", "DUPLICATE_FIELD", {
          field: "email",
        });
      }
    }

    const studentUpdatePayload = {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone,
      profile_picture_url: input.profile_picture_url,
      school_id: input.school_id,
      student_number: input.student_number,
      gender: input.gender,
      birth: input.birth
        ? {
            place: input.birth.place,
            date: input.birth.date,
          }
        : undefined,
      student_status: input.student_status,
      scholarship: input.scholarship,
      academic_status: input.academic_status,
      enrollment_date: input.enrollment_date,
      graduation_date: input.graduation_date,
      dropped_out_date: input.dropped_out_date,
      transferred_date: input.transferred_date,
      updated_at: new Date(),
    };

    const updatedStudent = await Student.findOneAndUpdate(
      { _id: studentId },
      { $set: studentUpdatePayload }
    );

    if (!updatedStudent) {
      throw CreateAppError("Student not found", "NOT_FOUND", { studentId });
    }

    const oldSchoolId = String(updatedStudent.school_id);
    const newSchoolId = String(input.school_id);

    // *************** transfer student by change school_id
    if (oldSchoolId !== newSchoolId) {
      if (oldSchoolId) {
        await School.updateOne(
          { _id: oldSchoolId },
          { $pull: { students: studentId } }
        );
      }

      if (newSchoolId) {
        await School.updateOne(
          { _id: newSchoolId },
          { $addToSet: { students: studentId } }
        );
      }
      await Student.updateOne(
        { _id: studentId },
        { $set: { transferred_date: new Date() } }
      );
    }

    const updateStudentResponse = { id: studentId };
    return updateStudentResponse;
  } catch (error) {
    throw HandleCaughtError(
      error,
      "Failed to update student",
      "VALIDATION_ERROR"
    );
  }
}

/**
 * Soft deletes a student by setting status to "DELETED" and saving deleted metadata.
 *
 * @async
 * @function DeleteStudent
 * @param {object} _ - Unused root resolver parameter.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The ID of the student to delete.
 * @param {object} args.input - Optional input containing deleted_by field.
 * @returns {Promise<object>} The soft-deleted student object.
 */

async function DeleteStudent(_, { id, input }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    const studentId = await ValidateMongoId(id);
    const deleted = await Student.updateOne(
      { _id: studentId, student_status: { $ne: "DELETED" } },
      {
        $set: {
          student_status: "DELETED",
          deleted_at: new Date(),
          deleted_by: input ? input.deleted_by : null,
        },
      }
    );

    if (!deleted) {
      throw CreateAppError("Student not found", "NOT_FOUND", { studentId });
    }

    const deleteStudentResponse = { id: studentId };
    return deleteStudentResponse;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to delete student");
  }
}

// *************** LOADER ***************

/**
 * Resolves the school associated with a student using DataLoader.
 *
 * @function schools
 * @param {object} student - The student object.
 * @param {object} _ - Unused resolver parameter.
 * @param {object} context - The Apollo context containing loaders.
 * @returns {Promise<object>} The resolved school object.
 */

function schools(student, _, context) {
  if (!context && !context.loaders && !context.loaders.school) {
    throw new Error("School loader not initialized");
  }

  const schoolLoaderResponse = context.loaders.school.load(
    String(student.school_id)
  );
  return schoolLoaderResponse;
}

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
    school: schools,
  },
};

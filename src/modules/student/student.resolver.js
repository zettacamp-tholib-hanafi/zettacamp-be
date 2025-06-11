// *************** IMPORT MODULE ***************
const Student = require("./student.model.js");
const School = require("../school/school.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  ValidateCreateStudentInput,
  ValidateUpdateStudentInput,
} = require("./student.validator.js");

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

// *************** Constant Enum
const VALID_STATUS = ["ACTIVE", "PENDING", "DELETED"];
const VALID_GENDERS = ["MALE", "FEMALE"];
const VALID_ACADEMIC_STATUS = [
  "ENROLLED",
  "GRADUATED",
  "DROPPED_OUT",
  "TRANSFERRED",
];

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

async function GetAllStudents(_, { filter }) {
  try {
    const query = {};

    if (filter) {
      if (filter.student_status) {
        if (!VALID_STATUS.includes(filter.student_status)) {
          throw CreateAppError(
            "Invalid student_status filter value",
            "BAD_REQUEST",
            { student_status: filter.student_status }
          );
        }
        query.student_status = filter.student_status;
      } else {
        query.student_status = "ACTIVE";
      }
      if (filter.academic_status) {
        if (!VALID_ACADEMIC_STATUS.includes(filter.academic_status)) {
          throw CreateAppError(
            "Invalid academic_status filter value",
            "BAD_REQUEST",
            { academic_status: filter.academic_status }
          );
        }
        query.academic_status = filter.academic_status;
      }
      if (filter.gender) {
        if (!VALID_GENDERS.includes(filter.gender)) {
          throw CreateAppError("Invalid gender filter value", "BAD_REQUEST", {
            gender: filter.gender,
          });
        }
        query.gender = filter.gender;
      }
    }

    return await Student.find(query);
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

async function GetOneStudent(_, { id, filter }) {
  try {
    const query = { _id: id };

    if (filter) {
      if (filter.student_status) {
        if (!VALID_STATUS.includes(filter.student_status)) {
          throw CreateAppError(
            "Invalid student_status filter value",
            "BAD_REQUEST",
            { student_status: filter.student_status }
          );
        }
        query.student_status = filter.student_status;
      } else {
        query.student_status = "ACTIVE";
      }
      if (filter.academic_status) {
        if (!VALID_ACADEMIC_STATUS.includes(filter.academic_status)) {
          throw CreateAppError(
            "Invalid academic_status filter value",
            "BAD_REQUEST",
            { academic_status: filter.academic_status }
          );
        }
        query.academic_status = filter.academic_status;
      }
      if (filter.gender) {
        if (!VALID_GENDERS.includes(filter.gender)) {
          throw CreateAppError("Invalid gender filter value", "BAD_REQUEST", {
            gender: filter.gender,
          });
        }
        query.gender = filter.gender;
      }
    }

    const student = await Student.findOne(query);
    if (!student) {
      throw CreateAppError("Student not found", "NOT_FOUND", { id });
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

async function CreateStudent(_, { input }) {
  try {
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

async function UpdateStudent(_, { id, input }) {
  try {
    ValidateUpdateStudentInput(input);

    const currentStudent = await Student.findById(id);
    if (!currentStudent) {
      throw CreateAppError("Student not found", "NOT_FOUND", { id });
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
      { _id: id },
      { $set: studentUpdatePayload }
    );

    if (!updatedStudent) {
      throw CreateAppError("Student not found", "NOT_FOUND", { id });
    }

    const oldSchoolId = String(updatedStudent.school_id);
    const newSchoolId = String(input.school_id);

    // *************** transfer student by change school_id
    if (oldSchoolId !== newSchoolId) {
      if (oldSchoolId) {
        await School.updateOne(
          { _id: oldSchoolId },
          { $pull: { students: id } }
        );
      }

      if (newSchoolId) {
        await School.updateOne(
          { _id: newSchoolId },
          { $addToSet: { students: id } }
        );
      }
      await Student.updateOne(
        { _id: id },
        { $set: { transferred_date: new Date() } }
      );
    }

    return { id };
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

async function DeleteStudent(_, { id, input }) {
  try {
    const deleted = await Student.updateOne(
      { _id: id, student_status: { $ne: "DELETED" } },
      {
        $set: {
          student_status: "DELETED",
          deleted_at: new Date(),
          deleted_by: input ? input.deleted_by : null,
        },
      }
    );

    if (!deleted) {
      throw CreateAppError("Student not found", "NOT_FOUND", { id });
    }

    return { id };
  } catch (error) {
    throw HandleCaughtError(error, "Failed to delete student");
  }
}

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

  return context.loaders.school.load(String(student.school_id));
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

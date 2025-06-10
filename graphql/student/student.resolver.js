// *************** IMPORT MODULE ***************
const Student = require("./student.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  validateCreateStudentInput,
  validateUpdateStudentInput,
} = require("./student.validator.js");

// *************** IMPORT UTILITIES ***************
const {
  handleCaughtError,
  createAppError,
} = require("../../utils/ErrorFormat.js");

const VALID_STATUS = ["ACTIVE", "PENDING", "DELETED"];

// *************** QUERY ***************

const GetAllStudents = async (_, { filter }) => {
  try {
    const query = {};

    if (filter && filter.student_status) {
      if (!VALID_STATUS.includes(filter.student_status)) {
        throw createAppError(
          "Invalid student_status filter value",
          "BAD_REQUEST",
          { student_status: filter.student_status }
        );
      }
      query.student_status = filter.student_status;
    } else {
      query.student_status = "ACTIVE";
    }

    return await Student.find(query);
  } catch (error) {
    throw handleCaughtError(error, "Failed to fetch students");
  }
};

const GetOneStudent = async (_, { id, filter }) => {
  try {
    const query = { _id: id };

    if (filter && filter.student_status) {
      if (!VALID_STATUS.includes(filter.student_status)) {
        throw createAppError(
          "Invalid student_status filter value",
          "BAD_REQUEST",
          { student_status: filter.student_status }
        );
      }
      query.student_status = filter.student_status;
    } else {
      query.student_status = "ACTIVE";
    }

    const student = await Student.findOne(query);
    if (!student) {
      throw createAppError("Student not found", "NOT_FOUND", { id });
    }

    return student;
  } catch (error) {
    throw handleCaughtError(error, "Failed to fetch student", "INTERNAL");
  }
};

// *************** MUTATION ***************

const CreateStudent = async (_, { input }) => {
  try {
    validateCreateStudentInput(input);

    const existing = await Student.findOne({ email: input.email });
    if (existing) {
      throw createAppError("Email is already in use", "DUPLICATE_FIELD", {
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

    const student = new Student(studentInputPayload);
    return await student.save();
  } catch (error) {
    throw handleCaughtError(
      error,
      "Failed to create student",
      "VALIDATION_ERROR"
    );
  }
};

const UpdateStudent = async (_, { id, input }) => {
  try {
    validateUpdateStudentInput(input);

    const currentStudent = await Student.findById(id);
    if (!currentStudent) {
      throw createAppError("Student not found", "NOT_FOUND", { id });
    }

    if (input.email && input.email !== currentStudent.email) {
      const existing = await Student.findOne({ email: input.email });
      if (existing) {
        throw createAppError("Email is already in use", "DUPLICATE_FIELD", {
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

    const updated = await Student.findOneAndUpdate(
      { _id: id },
      { $set: studentUpdatePayload }
    );

    if (!updated) {
      throw createAppError("Student not found", "NOT_FOUND", { id });
    }

    return updated;
  } catch (error) {
    throw handleCaughtError(
      error,
      "Failed to update student",
      "VALIDATION_ERROR"
    );
  }
};

const DeleteStudent = async (_, { id, input }) => {
  try {
    const deleted = await Student.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          student_status: "DELETED",
          deleted_at: new Date(),
          deleted_by: input?.deleted_by || null,
        },
      }
    );

    if (!deleted) {
      throw createAppError("Student not found", "NOT_FOUND", { id });
    }

    return deleted;
  } catch (error) {
    throw handleCaughtError(error, "Failed to delete student");
  }
};

// *************** Field resolver: Get school of a student
const schools = (student, _, context) => {
  if (!context?.loaders?.school) {
    throw new Error("School loader not initialized");
  }

  return context.loaders.school.load(student.school_id.toString());
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
    school: schools,
  },
};

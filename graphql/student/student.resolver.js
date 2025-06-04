// *************** IMPORT MODEL ***************
const Student = require('./student.model.js');

// *************** QUERY ***************

// *************** Get all students (excluding soft-deleted)
const GetAllStudents = async () => {
    return await Student.find({ deleted_at: null });
};

// *************** Get a specific student by ID (if not deleted)
const GetOneStudent = async (_, { id }) => {
    return await Student.findOne({ _id: id, deleted_at: null });
};

// *************** MUTATION ***************

// *************** Create new student
const CreateStudent = async (_, { input }) => {
    const student = new Student(input);
    return await student.save();
};

// *************** Update existing student by ID
const UpdateStudent = async (_, { id, input }) => {
    return await Student.findOneAndUpdate(
        { _id: id },
        { $set: input },
        { new: true }
    );
};

// *************** Soft delete a student by ID
const DeleteStudent = async (_, { id }) => {
    return await Student.findOneAndUpdate(
        { _id: id },
        { $set: { deleted_at: new Date() } },
        { new: true }
    );
};

// *************** RESOLVER ***************

// *************** Resolve school relation
const school = async (student, _, { loaders }) => {
    return await loaders.school.load(student.school_id.toString());
};

// *************** EXPORT ***************
module.exports = {
    Query: {
        GetAllStudents,
        GetOneStudent
    },
    Mutation: {
        CreateStudent,
        UpdateStudent,
        DeleteStudent
    },
    Student: {
        school
    }
};

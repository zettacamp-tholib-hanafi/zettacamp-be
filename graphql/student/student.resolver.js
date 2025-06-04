// *************** IMPORT MODEL ***************
import Student from './student.model.js';

// *************** RESOLVER ***************
const StudentResolver = {

    // *************** QUERY ***************
    Query: {
        // Get all students (excluding soft-deleted)
        GetAllStudents: async () => {
            return await Student.find({ deleted_at: null });
        },

        // Get a specific student by ID (if not deleted)
        GetOneStudent: async (_, { id }) => {
            return await Student.findOne({ _id: id, deleted_at: null });
        },
    },
    Mutation: {
        // create new Student
        CreateStudent: async (_, { input }) => {
            const student = new Student(input)
            return await student.save()
        },
        // Update existing student by ID
        UpdateStudent: async (_, { id, input }) => {
            return await Student.findOneAndUpdate(
                { _id: id },
                { $set: input },
                { new: true }
            );
        },

        // Soft delete a student by ID
        DeleteStudent: async (_, { id }) => {
            const deletedStudent = await Student.findOneAndUpdate(
                { _id: id },
                { $set: { deleted_at: new Date() } },
                { new: true }
            );
            return deletedStudent;
        },
    },
    Student: {
        // Resolve school relation
        school: async (student, _, { loaders }) => {
            return await loaders.school.load(student.school_id.toString());
        }
    }
};

// *************** EXPORT RESOLVER ***************
export default StudentResolver;
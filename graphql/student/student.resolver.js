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
        UpdateUser: async (_, { id, input }) => {
            return await User.findOneAndUpdate(
                { _id: id },
                { $set: input },
                { new: true }
            );
        },

        // Soft delete a student by ID
        DeleteUser: async (_, { id }) => {
            const deletedUser = await User.findOneAndUpdate(
                { _id: id },
                { $set: { deleted_at: new Date() } },
                { new: true }
            );
            return deletedUser;
        },
    },
    Student: {
        // Resolve school relation
        school: async (student, _, { loaders }) => {
            return await loaders.school.load(student.schoolId.toString());
        }
    }
};

// *************** EXPORT RESOLVER ***************
export default StudentResolver;
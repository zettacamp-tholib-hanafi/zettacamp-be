// *************** IMPORT MODEL ***************
import Student from './student.model.js';

// *************** RESOLVER ***************
const StudentResolver = {

  // *************** QUERY ***************
  Query: {
    // Get all students (excluding soft-deleted)
    GetAllStudents: async () => {
      return await Student.find({deleted_at: null});
    },

    // Get a specific student by ID (if not deleted)
    GetOneStudent: async (_, { id }) => {
      return await Student.findOne({ _id: id, deleted_at: null });
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
// *************** IMPORT MODEL ***************
import School from './school.model.js';

// *************** RESOLVER ***************
const SchoolResolver = {

    // *************** QUERY ***************
    Query: {
        // Get all schools (excluding soft-deleted)
        GetAllSchools: async () => {
            return await School.find({ deleted_at: null });
        },

        // Get a specific school by ID (if not deleted)
        GetOneSchool: async (_, { id }) => {
            return await School.findOne({ _id: id, deleted_at: null });
        },
    },
    
    School: {
        // Get all students in this school
        students: async (school) => {
            return await Student.find({ schoolId: school._id, deleted_at: null });
        },
    },

};

// *************** EXPORT RESOLVER ***************
export default SchoolResolver;
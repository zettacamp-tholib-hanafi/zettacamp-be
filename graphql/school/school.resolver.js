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
    Mutation: {
        // create new School
        CreateSchool: async (_, { input }) => {
            const school = new School(input)
            return await school.save()
        },
        // Update existing school by ID
        UpdateUser: async (_, { id, input }) => {
            return await User.findOneAndUpdate(
                { _id: id },
                { $set: input },
                { new: true }
            );
        },

        // Soft delete a school by ID
        DeleteUser: async (_, { id }) => {
            const deletedUser = await User.findOneAndUpdate(
                { _id: id },
                { $set: { deleted_at: new Date() } },
                { new: true }
            );
            return deletedUser;
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
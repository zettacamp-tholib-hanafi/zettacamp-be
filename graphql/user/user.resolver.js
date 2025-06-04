// *************** IMPORT MODEL ***************
import User from './user.model.js';

// *************** RESOLVER ***************
const UserResolver = {

  // *************** QUERY ***************
  Query: {
    // Get all users (excluding soft-deleted)
    GetAllUsers: async () => {
      return await User.find({deleted_at: null});
    },

    // Get a specific user by ID (if not deleted)
    GetOneUser: async (_, { id }) => {
      return await User.findOne({ _id: id, deleted_at: null });
    },
  },

  // *************** MUTATION ***************
  Mutation: {
    // Create a new user
    CreateUser: async (_, { input }) => {
      const user = new User(input);
      return await user.save();
    },

    // Update existing user by ID
    UpdateUser: async (_, { id, input }) => {
      return await User.findOneAndUpdate(
        { _id: id },
        { $set: input },
        { new: true }
      );
    },

    // Soft delete a user by ID
    DeleteUser: async (_, { id }) => {
      const deletedUser = await User.findOneAndUpdate(
        { _id: id },
        { $set: { deleted_at: new Date() } },
        { new: true }
      );
      return deletedUser;
    },
  }
};

// *************** EXPORT RESOLVER ***************
export default UserResolver;
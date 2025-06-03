// *************** IMPORT MODEL ***************
import User from '../../models/User.js';

// *************** RESOLVER ***************
const userResolver = {

  // *************** QUERY ***************
  Query: {
    // Get all users (excluding soft-deleted)
    users: async () => {
      return await User.find({deletedAt: null});
    },

    // Get a specific user by ID (if not deleted)
    user: async (_, { id }) => {
      return await User.findOne({ _id: id, deletedAt: null });
    },
  },

  // *************** MUTATION ***************
  Mutation: {
    // Create a new user
    createUser: async (_, { input }) => {
      const user = new User(input);
      return await user.save();
    },

    // Update existing user by ID
    updateUser: async (_, { id, input }) => {
      return await User.findOneAndUpdate(
        { _id: id },
        { $set: input },
        { new: true }
      );
    },

    // Soft delete a user by ID
    deleteUser: async (_, { id }) => {
      const deletedUser = await User.findOneAndUpdate(
        { _id: id },
        { $set: { deletedAt: new Date() } },
        { new: true }
      );
      return deletedUser;
    },
  }
};

// *************** EXPORT RESOLVER ***************
export default userResolver;
// *************** IMPORT MODEL ***************
const User = require('./user.model.js');

// *************** QUERY ***************

// *************** Get all users (excluding soft-deleted)
const GetAllUsers = async () => {
  return await User.find({ deleted_at: null });
};

// *************** Get a specific user by ID (if not deleted)
const GetOneUser = async (_, { id }) => {
  return await User.findOne({ _id: id, deleted_at: null });
};

// *************** MUTATION ***************

// *************** Create a new user
const CreateUser = async (_, { input }) => {
  const user = new User(input);
  return await user.save();
};

// *************** Update existing user by ID
const UpdateUser = async (_, { id, input }) => {
  return await User.findOneAndUpdate(
    { _id: id },
    { $set: input },
    { new: true }
  );
};

// *************** Soft delete a user by ID
const DeleteUser = async (_, { id }) => {
  return await User.findOneAndUpdate(
    { _id: id },
    { $set: { deleted_at: new Date() } },
    { new: true }
  );
};

// *************** EXPORT ***************
module.exports = {
  Query: {
    GetAllUsers,
    GetOneUser
  },
  Mutation: {
    CreateUser,
    UpdateUser,
    DeleteUser
  }
};

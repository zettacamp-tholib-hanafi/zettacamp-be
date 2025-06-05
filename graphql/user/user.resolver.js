// *************** IMPORT MODULE ***************
const User = require("./user.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  validateCreateUserInput,
  validateUpdateUserInput,
} = require("./user.validator.js");

// *************** IMPORT HELPER FUNCTION ***************
const {
  handleCaughtError,
  createAppError,
} = require("../../utils/error.helper.js");
const { SanitizeInput } = require("../../utils/SanitizeInput.js");

// *************** QUERY ***************

// *************** Get all users (excluding soft-deleted)
const GetAllUsers = async () => {
  try {
    return await User.find({ deleted_at: null });
  } catch (error) {
    throw handleCaughtError(error, "Failed to fetch users");
  }
};

// *************** Get a specific user by ID (if not deleted)
const GetOneUser = async (_, { id }) => {
  try {
    const user = await User.findOne({ _id: id, deleted_at: null });
    if (!user) {
      throw createAppError("User not found", "NOT_FOUND", { id });
    }
    return user;
  } catch (error) {
    throw handleCaughtError(error, "Failed to fetch user", "INTERNAL");
  }
};

// *************** MUTATION ***************

// *************** Create a new user
const CreateUser = async (_, { input }) => {
  try {
    // *************** Validate input payload
    validateCreateUserInput(userInputSanitize);

    // *************** allowed input fields
    const allowedFields = [
      "first_name",
      "last_name",
      "email",
      "role",
      "password",
    ];
    const userInputSanitize = SanitizeInput(input, allowedFields);

    // *************** save to database
    const user = new User(userInputSanitize);
    return await user.save();
  } catch (error) {
    throw handleCaughtError(error, "Failed to create user", "VALIDATION_ERROR");
  }
};

// *************** Update existing user by ID
const UpdateUser = async (_, { id, input }) => {
  try {
    // *************** Validate input payload
    validateUpdateUserInput(input);

    // *************** allowed input fields
    const allowedFields = [
      "first_name",
      "last_name",
      "email",
      "role",
      "password",
    ];
    const userUpdateSanitize = SanitizeInput(input, allowedFields);
    
    // *************** update to database
    const updated = await User.findOneAndUpdate(
      { _id: id },
      { $set: userUpdateSanitize },
      { new: true }
    );
    if (!updated) {
      throw createAppError("User not found", "NOT_FOUND", { id });
    }
    return updated;
  } catch (error) {
    throw handleCaughtError(error, "Failed to update user", "VALIDATION_ERROR");
  }
};

// *************** Soft delete a user by ID
const DeleteUser = async (_, { id }) => {
  try {
    const deleted = await User.findOneAndUpdate(
      { _id: id },
      { $set: { deleted_at: new Date() } },
      { new: true }
    );
    if (!deleted) {
      throw createAppError("User not found", "NOT_FOUND", { id });
    }
    return deleted;
  } catch (error) {
    throw handleCaughtError(error, "Failed to delete user");
  }
};

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllUsers,
    GetOneUser,
  },
  Mutation: {
    CreateUser,
    UpdateUser,
    DeleteUser,
  },
};

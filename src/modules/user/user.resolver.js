// *************** IMPORT MODULE ***************
const User = require("./user.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  ValidateCreateUserInput,
  ValidateUpdateUserInput,
} = require("./user.validator.js");

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

// *************** Constant Enum
const VALID_STATUS = ["ACTIVE", "PENDING", "DELETED"];

// *************** QUERY ***************

/**
 * Get all users based on filter criteria.
 *
 * @param {Object} _ - Unused first resolver argument.
 * @param {Object} args - Resolver arguments.
 * @param {Object} [args.filter] - Optional filter object.
 * @param {string} [args.filter.user_status] - Filter by user status.
 * @returns {Promise<Array>} List of users matching the criteria.
 */

async function GetAllUsers(_, { filter }) {
  try {
    const query = {};

    if (filter && filter.user_status) {
      if (!VALID_STATUS.includes(filter.user_status)) {
        throw CreateAppError(
          "Invalid user_status filter value",
          "BAD_REQUEST",
          { user_status: filter.user_status }
        );
      }
      query.user_status = filter.user_status;
    } else {
      query.user_status = "ACTIVE";
    }

    return await User.find(query);
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch users");
  }
}

/**
 * Get a single user by ID and optional status filter.
 *
 * @param {Object} _ - Unused first resolver argument.
 * @param {Object} args - Resolver arguments.
 * @param {string} args.id - User ID.
 * @param {Object} [args.filter] - Optional filter object.
 * @param {string} [args.filter.user_status] - Filter by user status.
 * @returns {Promise<Object>} The user document.
 */

async function GetOneUser(_, { id, filter }) {
  try {
    const query = { _id: id };

    if (filter && filter.user_status) {
      if (!VALID_STATUS.includes(filter.user_status)) {
        throw CreateAppError(
          "Invalid user_status filter value",
          "BAD_REQUEST",
          { user_status: filter.user_status }
        );
      }
      query.user_status = filter.user_status;
    } else {
      query.user_status = "ACTIVE";
    }

    const user = await User.findOne(query);
    if (!user) {
      throw CreateAppError("User not found", "NOT_FOUND", { id });
    }

    return user;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch user", "INTERNAL");
  }
}

// *************** MUTATION ***************
/**
 * Create a new user.
 *
 * @param {Object} _ - Unused first resolver argument.
 * @param {Object} args - Resolver arguments.
 * @param {Object} args.input - User input data.
 * @returns {Promise<Object>} The created user document.
 */

async function CreateUser(_, { input }) {
  try {
    ValidateCreateUserInput(input);

    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw CreateAppError("Email is already in use", "DUPLICATE_FIELD", {
        field: "email",
      });
    }

    const userInputPayload = {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      password: input.password,
      role: input.role,
      user_status: input.user_status,
      phone: input.phone,
      profile_picture_url: input.profile_picture_url,
      department: input.department,
      permissions: input.permissions,
      preferences: input.preferences,
    };

    const user = new User(userInputPayload);

    return await user.save();
  } catch (error) {
    throw HandleCaughtError(error, "Failed to create user", "VALIDATION_ERROR");
  }
}

/**
 * Update an existing user by ID.
 *
 * @param {Object} _ - Unused first resolver argument.
 * @param {Object} args - Resolver arguments.
 * @param {string} args.id - User ID.
 * @param {Object} args.input - Updated user data.
 * @returns {Promise<Object>} The updated user document.
 */
async function UpdateUser(_, { id, input }) {
  try {
    ValidateUpdateUserInput(input);

    const currentUser = await User.findById(id);
    if (!currentUser) {
      throw CreateAppError("User not found", "NOT_FOUND", { id });
    }

    if (input.email && input.email !== currentUser.email) {
      const existing = await User.findOne({ email: input.email });
      if (existing) {
        throw CreateAppError("Email is already in use", "DUPLICATE_FIELD", {
          field: "email",
        });
      }
    }

    const userUpdatePayload = {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      password: input.password,
      role: input.role,
      user_status: input.user_status,
      phone: input.phone,
      profile_picture_url: input.profile_picture_url,
      department: input.department,
      permissions: input.permissions,
      preferences: input.preferences,
      updated_by: input.updated_by,
    };

    const updated = await User.findOneAndUpdate(
      { _id: id },
      { $set: userUpdatePayload }
    );

    if (!updated) {
      throw CreateAppError("User not found", "NOT_FOUND", { id });
    }

    return updated;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to update user", "VALIDATION_ERROR");
  }
}

/**
 * Soft delete a user by setting status to "DELETED" and timestamp.
 *
 * @param {Object} _ - Unused first resolver argument.
 * @param {Object} args - Resolver arguments.
 * @param {string} args.id - User ID.
 * @returns {Promise<Object>} The deleted (soft) user document.
 */

async function DeleteUser(_, { id }) {
  try {
    const deleted = await User.findOneAndUpdate(
      { _id: id, user_status: { $ne: "DELETED" } },
      {
        $set: {
          user_status: "DELETED",
          deleted_at: new Date(),
        },
      }
    );

    if (!deleted) {
      throw CreateAppError("User not found", "NOT_FOUND", { id });
    }

    return deleted;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to delete user");
  }
}

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

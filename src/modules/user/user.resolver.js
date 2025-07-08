// *************** IMPORT LIBRARY ***************
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// *************** IMPORT MODULE ***************
const User = require("./user.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  ValidateCreateUserInput,
  ValidateUpdateUserInput,
  ValidateLoginInput,
} = require("./user.validator.js");

// *************** IMPORT UTILITIES ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id.js");
const { CheckRoleAccess } = require("../../shared/utils/check_role_access.js");

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");
const { JWT_SECRET } = require("../../core/config.js");

// *************** IMPORT HELPER FUNCTION ***************
const { UserQueryPipeline, UserFilterStage } = require("./user.helper.js");

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

async function GetAllUsers(_, { filter, sort, pagination }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);

    const { pipeline, page, limit } = UserQueryPipeline(
      filter,
      sort,
      pagination
    );
    const result = await User.aggregate(pipeline);

    const data = result[0].data;
    const total = result[0].metadata[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const userResponse = {
      data,
      meta: {
        total,
        total_pages: totalPages,
        current_page: page,
        per_page: limit,
      },
    };

    return userResponse;
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

async function GetOneUser(_, { id, filter }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    const userId = await ValidateMongoId(id);

    const matchStage = UserFilterStage(filter, userId);
    const pipeline = [{ $match: matchStage }];
    const user = await User.aggregate(pipeline);

    if (!user) {
      throw CreateAppError("User not found", "NOT_FOUND", { userId });
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

    const createUserResponse = await User.create(userInputPayload);
    return createUserResponse;
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
    const userId = await ValidateMongoId(id);

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw CreateAppError("User not found", "NOT_FOUND", { userId });
    }

    if (input.email && input.email !== currentUser.email) {
      const existing = await User.findOne({ email: input.email });
      if (existing) {
        throw CreateAppError("Email is already in use", "DUPLICATE_FIELD", {
          field: "email",
        });
      }
    }

    if (input.password) {
      input.password = await bcrypt.hash(input.password, 10);
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

    const updated = await User.updateOne(
      { _id: userId },
      { $set: userUpdatePayload }
    );

    if (!updated) {
      throw CreateAppError("User not found", "NOT_FOUND", { userId });
    }

    const updateUserResponse = { id: userId };
    return updateUserResponse;
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

async function DeleteUser(_, { id }, context) {
  try {
    CheckRoleAccess(context, ["ACADEMIC_ADMIN", "ACADEMIC_DIRECTOR"]);
    const userId = await ValidateMongoId(id);

    const deleted = await User.updateOne(
      { _id: userId, user_status: { $ne: "DELETED" } },
      {
        $set: {
          user_status: "DELETED",
          deleted_at: new Date(),
        },
      }
    );

    if (!deleted) {
      throw CreateAppError("User not found", "NOT_FOUND", { userId });
    }

    const deleteUserResponse = { id: userId };
    return deleteUserResponse;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to delete user");
  }
}

/**
 * Authenticate a user and return a JWT token along with user data.
 *
 * This mutation performs the login process by:
 * - Validating the input email and password via `ValidateLoginInput`.
 * - Verifying credentials and rejecting unauthorized attempts.
 * - Generating a JWT token with payload: `{ user_id, role }`.
 * - Setting a token expiration of 7 days.
 * - Returning the token and the user data (excluding the password).
 *
 * @async
 * @function AuthLogin
 * @param {Object} _ - Unused resolver parent argument.
 * @param {Object} args - Resolver arguments.
 * @param {Object} args.input - The login input containing email and password.
 * @param {string} args.input.email - User email used for authentication.
 * @param {string} args.input.password - User password to be verified.
 * @returns {Promise<Object>} An object containing:
 *   - {string} token: Signed JWT token for the authenticated user.
 *   - {Object} user: The authenticated user's data (password already stripped).
 * @throws {AppError} If validation fails or credentials are invalid.
 */

async function AuthLogin(_, { input }) {
  try {
    const { email, password } = input;

    const user = await ValidateLoginInput(email, password);

    const payload = {
      user_id: String(user._id),
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "7d",
    });

    const loginResult = {
      token,
      user: user,
    };
    return loginResult;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to login user", "UNAUTHORIZED");
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
    AuthLogin,
  },
};

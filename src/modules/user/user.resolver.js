// *************** IMPORT MODULE ***************
const User = require("./user.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  validateCreateUserInput,
  validateUpdateUserInput,
} = require("./user.validator.js");

// *************** IMPORT UTILITIES ***************
const {
  handleCaughtError,
  createAppError,
} = require("../../core/error.js");

const VALID_STATUS = ["ACTIVE", "PENDING", "DELETED"];

// *************** QUERY ***************

// *************** Get all users with explicit user_status filter
async function GetAllUsers(_, { filter }) {
  try {
    // *************** Build query condition
    const query = {};

    if (filter && filter.user_status) {
      if (!VALID_STATUS.includes(filter.user_status)) {
        throw createAppError(
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
    throw handleCaughtError(error, "Failed to fetch users");
  }
}

// *************** Get a specific user by ID with explicit user_status filter
async function GetOneUser(_, { id, filter }) {
  try {
    // *************** Build query condition
    const query = { _id: id };

    if (filter && filter.user_status) {
      if (!VALID_STATUS.includes(filter.user_status)) {
        throw createAppError(
          "Invalid user_status filter value",
          "BAD_REQUEST",
          { user_status: filter.user_status }
        );
      }
      query.user_status = filter.user_status;
    } else {
      query.user_status = "ACTIVE";
    }

    // *************** Fetch user
    const user = await User.findOne(query);
    if (!user) {
      throw createAppError("User not found", "NOT_FOUND", { id });
    }

    return user;
  } catch (error) {
    throw handleCaughtError(error, "Failed to fetch user", "INTERNAL");
  }
}

// *************** MUTATION ***************

// *************** Create a new user
async function CreateUser(_, { input }) {
  try {
    // *************** Validate input payload
    validateCreateUserInput(input);

    // *************** Check if email already exists
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw createAppError("Email is already in use", "DUPLICATE_FIELD", {
        field: "email",
      });
    }

    // *************** make variable to hold user document
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

    // *************** Save to database
    const user = new User(userInputPayload);

    return await user.save();
  } catch (error) {
    throw handleCaughtError(error, "Failed to create user", "VALIDATION_ERROR");
  }
}

// *************** Update existing user by ID
async function UpdateUser(_, { id, input }) {
  try {
    // *************** Validate input payload
    validateUpdateUserInput(input);

    // *************** Check if email already exists
    const currentUser = await User.findById(id);
    if (!currentUser) {
      throw createAppError("User not found", "NOT_FOUND", { id });
    }

    if (input.email && input.email !== currentUser.email) {
      const existing = await User.findOne({ email: input.email });
      if (existing) {
        throw createAppError("Email is already in use", "DUPLICATE_FIELD", {
          field: "email",
        });
      }
    }

    // *************** Update to database
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
      throw createAppError("User not found", "NOT_FOUND", { id });
    }

    return updated;
  } catch (error) {
    throw handleCaughtError(error, "Failed to update user", "VALIDATION_ERROR");
  }
}

// *************** Soft delete a user by ID
async function DeleteUser(_, { id }) {
  try {
    const deleted = await User.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          user_status: "DELETED",
          deleted_at: new Date(),
        },
      }
    );

    if (!deleted) {
      throw createAppError("User not found", "NOT_FOUND", { id });
    }

    return deleted;
  } catch (error) {
    throw handleCaughtError(error, "Failed to delete user");
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

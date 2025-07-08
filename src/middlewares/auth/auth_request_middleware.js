// *************** IMPORT LIBRARY ***************
const jwt = require("jsonwebtoken");

// *************** IMPORT MODULE ***************
const User = require("../../modules/user/user.model");

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");
const { JWT_SECRET } = require("../../core/config.js");

/**
 * Authentication middleware for GraphQL context.
 *
 * @param {Object} request - Express request object.
 * @returns {Promise<Object>} The GraphQL context with `user` if authenticated.
 * @throws {AppError} If token is invalid or user is not found.
 */
async function AuthRequestMiddleware({ request }) {
  try {
    const authHeader = request?.headers?.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();

    console.info("AUTH_HEADER", authHeader);
    if (!token) return {};

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded?.user_id) {
        throw CreateAppError("Invalid token", "UNAUTHORIZED");
      }

      const user = await User.findById(decoded?.user_id).lean();

      if (!user || user.user_status === "DELETED") {
        throw CreateAppError("User not found or inactive", "UNAUTHORIZED");
      }

      return { user };
    } catch (error) {
      console.warn(
        "AuthRequestMiddleware failed to verify token:",
        error.message
      );

      return {};
    }
  } catch (error) {
    throw HandleCaughtError(error, "Authentication failed", "UNAUTHORIZED");
  }
}

module.exports = AuthRequestMiddleware;

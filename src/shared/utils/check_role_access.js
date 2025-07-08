// *************** IMPORT CORE ***************
const { CreateAppError } = require("../core/error");

/**
 * Check if authenticated user has access based on role.
 *
 * @param {Object} context - GraphQL context, must include `user` object with `role` field.
 * @param {string[]} allowedRoles - Array of roles allowed to access the resource.
 * @returns {boolean} True if access is allowed.
 *
 * @throws {AppError} If user not authenticated or role not allowed.
 */
function checkRoleAccess(context, allowedRoles = []) {
  const user = context?.user;
  if (!user) {
    throw CreateAppError("User not authenticated", "UNAUTHORIZED");
  }

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];

  const hasAccess = userRoles.some((role) => allowedRoles.includes(role));
  if (!hasAccess) {
    throw CreateAppError(
      "Access denied: insufficient permissions",
      "FORBIDDEN"
    );
  }

  return true;
}

module.exports = checkRoleAccess;

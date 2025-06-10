const ERROR_CODES = {
  VALIDATION_ERROR: "BAD_USER_INPUT",
  DUPLICATE_KEY: "BAD_USER_INPUT",
  NOT_FOUND: "NOT_FOUND",
  AUTH_ERROR: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL: "INTERNAL_SERVER_ERROR",
};

/**
 * Create a standardized AppError instance.
 *
 * @param {string} message - Error message to display.
 * @param {string} [type='INTERNAL'] - Logical type of the error.
 * @param {object} [metadata={}] - Extra metadata (e.g., field name).
 * @returns {Error} AppError instance with GraphQL-compatible structure.
 */
const createAppError = (message, type = "INTERNAL", metadata = {}) => {
  const code = ERROR_CODES[type] || ERROR_CODES.INTERNAL;

  const error = new Error(message);
  error.name = "AppError";

  error.extensions = {
    // *************** GraphQL-compliant code for frontend interpretation
    code,

    // *************** Logical type useful for internal debugging and filtering
    type,

    // *************** Metadata helps identify source (e.g., field, ID)
    metadata,
  };

  // *************** Return custom error object
  return error;
};

/**
 * Handle caught error and wrap into AppError if needed.
 *
 * @param {Error} originalError - Original error thrown.
 * @param {string} fallbackMessage - Fallback if error.message not present.
 * @param {string} [type='INTERNAL'] - Logical error type.
 * @returns {Error} AppError (or passthrough if already structured).
 */
const handleCaughtError = (
  originalError,
  fallbackMessage,
  type = "INTERNAL"
) => {
  // *************** Use fallback if error has no message
  const message = originalError ? originalError.message : fallbackMessage;

  // *************** Already formatted, return as-is
  if (originalError && originalError.extensions && !originalError.extensions.code) {
    return originalError;
  }

  // *************** Log original error for backend inspection
  console.error("[ERROR]", originalError);

  // *************** Special handling for MongoDB duplicate key error
  if (originalError.code === 11000) {
    // *************** Extract duplicated field name from error object
    const duplicatedField =
      Object.keys(originalError.keyPattern ? originalError.keyPattern : {})[0] || "Field";

    // *************** Return structured duplicate key error
    return createAppError(
      `${capitalize(duplicatedField)} already exists.`,
      "DUPLICATE_KEY",
      { field: duplicatedField }
    );
  }

  // *************** Default fallback to internal error
  return createAppError(message, type);
};

/**
 * Format GraphQL error response to exclude internal stacktrace.
 *
 * This function ensures a clean and predictable shape for errors
 * returned to the client, including only relevant metadata.
 *
 * @param {import('graphql').GraphQLError} error - The original GraphQL error object.
 * @returns {object} Cleaned error response with limited fields.
 */
const formatError = (error) => {
  return {
    message: error.message,

    // *************** Path to field/mutation that caused the error
    path: error.path,

    extensions: {
      // *************** GraphQL-compliant error code (for frontend handling)
      code: error.extensions? error.extensions.code : "INTERNAL_SERVER_ERROR",

      // *************** Logical type of error for internal grouping
      type: error.extensions ? error.extensions.type : "INTERNAL",

      // *************** Optional metadata (e.g., field name)
      metadata: error.extensions ? error.extensions.metadata : null,
    },
  };
};

/**
 * Capitalize the first letter of a string.
 *
 * @param {string} str
 * @returns {string}
 */
const capitalize = (str) =>
  // *************** Title-case utility for field names in messages
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

// *************** EXPORT MODULE ***************

module.exports = {
  createAppError,
  handleCaughtError,
  formatError,
};

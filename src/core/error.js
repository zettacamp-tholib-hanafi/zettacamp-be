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
const CreateAppError = (message, type = "INTERNAL", metadata = {}) => {
  const code = ERROR_CODES[type] || ERROR_CODES.INTERNAL;

  const error = new Error(message);
  error.name = "AppError";

  error.extensions = {
    code,
    type,
    metadata,
  };

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
const HandleCaughtError = (
  originalError,
  fallbackMessage,
  type = "INTERNAL"
) => {
  const message = originalError ? originalError.message : fallbackMessage;

  if (
    originalError &&
    originalError.extensions &&
    !originalError.extensions.code
  ) {
    return originalError;
  }

  console.error("[ERROR]", originalError);

  if (originalError.code === 11000) {
    const duplicatedField =
      Object.keys(
        originalError.keyPattern ? originalError.keyPattern : {}
      )[0] || "Field";

    return CreateAppError(
      `${capitalize(duplicatedField)} already exists.`,
      "DUPLICATE_KEY",
      { field: duplicatedField }
    );
  }

  return CreateAppError(message, type);
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
const FormatError = (error) => {
  return {
    message: error.message,
    path: error.path,
    extensions: {
      code: error.extensions ? error.extensions.code : "INTERNAL_SERVER_ERROR",
      type: error.extensions ? error.extensions.type : "INTERNAL",
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
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

// *************** EXPORT MODULE ***************

module.exports = {
  CreateAppError,
  HandleCaughtError,
  FormatError,
};

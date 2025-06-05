/**
 * Sanitize input object:
 * - Only allow allowed fields
 * - Trim strings
 * - Convert string 'null' to actual null
 */
function SanitizeInput(input, allowedFields = []) {
  return allowedFields
    .filter((key) => Object.prototype.hasOwnProperty.call(input, key))
    .map((key) => {
      const value = input[key];

      if (typeof value === "string") {
        const trimmed = value.trim();
        return [key, trimmed.toLowerCase() === "null" ? null : trimmed];
      }

      return [key, value];
    })
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
}
// *************** EXPORT MODULE ***************

module.exports = { SanitizeInput };

/**
 * Round a float number to a fixed number of decimal places.
 *
 * @param {number} value - The number to round.
 * @param {number} decimals - Number of digits after the decimal point.
 * @returns {number} Rounded float.
 */
function RoundFloat(value, decimals = 2) {
  if (typeof value !== "number") return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

module.exports = {
  RoundFloat,
};

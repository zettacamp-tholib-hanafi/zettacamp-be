/**
 * Get the current system time formatted as "HH:MM:SS".
 *
 * This utility function retrieves the current time from the system clock
 * and returns it as a string in 24-hour format, ensuring each component
 * (hour, minute, second) is zero-padded to 2 digits.
 *
 * @returns {string} A string representing the current time in "HH:MM:SS" format.
 *
 */

function TimeNow() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// *************** EXPORT MODULE ***************
module.exports = {
  TimeNow,
};

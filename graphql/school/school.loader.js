// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const School = require("./school.model");

/**
 * Batch load schools by their IDs using DataLoader pattern.
 *
 * This function fetches multiple School documents based on an array of IDs.
 * It returns the results in the same order as the provided IDs. If a school
 * is not found for a given ID, `null` will be returned in its place.
 *
 * @param {string[]} school_id - An array of school IDs to be fetched.
 * @returns {Promise<(Object|null)[]>} An array of School objects or null values,
 *          each corresponding to the requested IDs' order.
 */

async function batchSchoolsById(school_id) {
  const schools = await School.find({
    _id: { $in: school_id },
  });

  return school_id.map(
    (id) =>
      schools.find((school) => school._id.toString() === id.toString()) || null
  );
}

// *************** LOADER ***************
function schoolLoader() {
  return new DataLoader(batchSchoolsById);
}

// *************** EXPORT MODULE ***************
module.exports = { schoolLoader };

// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const Test = require("./test.model");

/**
 * Batches and returns test documents corresponding to an array of test IDs.
 *
 * This function is typically used with DataLoader to batch and cache requests for tests
 * by their `_id` values. It performs a single database query to retrieve all matching
 * tests and then maps the result back to the original input order.
 *
 * @async
 * @function BatchTestsById
 * @param {string[]} test_id - An array of test IDs to fetch from the database.
 *
 * @returns {Promise<Object[]>} A promise that resolves to an array of test documents,
 * mapped in the same order as the input `test_id` array. If a test is not found,
 * its corresponding slot will be `undefined`.
 */

async function BatchTestsById(test_id) {
  const tests = await Test.find({
    _id: { $in: test_id },
  });

  return test_id.map((id) =>
    tests.find((test) => String(test._id) === String(id))
  );
}

// *************** LOADER ***************
function TestLoader() {
  return new DataLoader(BatchTestsById);
}

// *************** EXPORT MODULE ***************
module.exports = { TestLoader };

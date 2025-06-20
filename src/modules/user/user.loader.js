// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const User = require("./user.model");
/**
 * Batches and returns user documents corresponding to an array of user IDs.
 *
 * This function is typically used with DataLoader to batch and cache requests for users
 * by their `_id` values. It performs a single database query to retrieve all matching
 * users and then maps the result back to the original input order.
 *
 * @async
 * @function BatchUserById
 * @param {string[]} user_ids - An array of user IDs to fetch from the database.
 *
 * @returns {Promise<Object[]>} A promise that resolves to an array of user documents,
 * mapped in the same order as the input `user_ids` array. If a user is not found,
 * its corresponding slot will be `undefined`.
 */
async function BatchUserById(user_ids) {
  const users = await User.find({
    _id: { $in: user_ids },
  });

  const batchUserResponse = user_ids.map((id) =>
    users.find((user) => String(user._id) === String(id))
  );
  return batchUserResponse;
}

// *************** LOADER ***************
function UserLoader() {
  const userLoaderRespose = new DataLoader(BatchUserById);
  return userLoaderRespose;
}

// *************** EXPORT MODULE ***************
module.exports = { UserLoader };

// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const Block = require("./block.model");

/**
 * Batch load blocks by their IDs using DataLoader pattern.
 *
 * This function fetches multiple Block documents based on an array of IDs.
 * It returns the results in the same order as the provided IDs. If a block
 * is not found for a given ID, `null` will be returned in its place.
 *
 * @param {string[]} block_id - An array of block IDs to be fetched.
 * @returns {Promise<(Object|null)[]>} An array of Block objects or null values,
 *          each corresponding to the requested IDs' order.
 */

async function BatchBlocksById(block_id) {
  const blocks = await Block.find({
    _id: { $in: block_id },
  });

  return block_id.map((id) =>
    blocks.find((block) => String(block._id) === String(id))
  );
}

// *************** LOADER ***************
function BlockLoader() {
  return new DataLoader(BatchBlocksById);
}

// *************** EXPORT MODULE ***************
module.exports = { BlockLoader };

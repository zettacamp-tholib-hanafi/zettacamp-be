// *************** IMPORT MODULE ***************
const Block = require("./block.model.js");

// *************** IMPORT VALIDATOR ***************

// *************** IMPORT CORE ***************
const { HandleCaughtError, CreateAppError } = require("../../core/error.js");

const VALID_STATUS = ["ACTIVE", "ARCHIVED", "DELETED"];

// *************** QUERY ***************

/**
 * Get a list of blocks based on an optional block_status filter.
 *
 * This resolver fetches all academic blocks from the database. If a `block_status`
 * filter is provided, it validates and applies the filter to the query. If no filter
 * is specified, it defaults to returning blocks with status `ACTIVE`.
 *
 * @param {Object} _ - Unused parent resolver argument (per GraphQL convention).
 * @param {Object} args - Arguments passed to the query.
 * @param {Object} args.filter - Optional filter object.
 * @param {string} args.filter.block_status - Filter by block status (e.g., 'ACTIVE', 'ARCHIVED', 'DELETED').
 *
 * @returns {Promise<Object[]>} A promise resolving to an array of Block documents.
 *
 * @throws {AppError} If the provided block_status is invalid or any internal error occurs.
 */

async function GetAllBlocks(_, { filter }) {
  try {
    const query = {};

    if (filter && filter.block_status) {
      if (!VALID_STATUS.includes(filter.block_status)) {
        throw CreateAppError(
          "Invalid block_status filter value",
          "BAD_REQUEST",
          { block_status: filter.block_status }
        );
      }
      query.block_status = filter.block_status;
    } else {
      query.block_status = "ACTIVE";
    }

    return await Block.find(query);
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch blocks");
  }
}

async function GetOneBlock(_, { id, filter }) {
  try {
    const query = { _id: id };

    if (filter && filter.block_status) {
      if (!VALID_STATUS.includes(filter.block_status)) {
        throw CreateAppError(
          "Invalid block_status filter value",
          "BAD_REQUEST",
          { block_status: filter.block_status }
        );
      }
      query.block_status = filter.block_status;
    } else {
      query.block_status = "ACTIVE";
    }

    const block = await Block.findOne(query);
    if (!block) {
      throw CreateAppError("Block not found", "NOT_FOUND", { id });
    }

    return block;
  } catch (error) {
    throw HandleCaughtError(error, "Failed to fetch block");
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllBlocks,
    GetOneBlock,
  },
};

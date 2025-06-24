// *************** IMPORT MODULE ***************
const Block = require("./block.model.js");

// *************** IMPORT VALIDATOR ***************
const {
  ValidateCreateBlock,
  ValidateUpdateBlock,
} = require("./block.validator.js");

// *************** IMPORT UTILS ***************
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id.js");

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
        const handlingError = CreateAppError(
          "Invalid block_status filter value",
          "BAD_REQUEST",
          { block_status: filter.block_status }
        );
        throw handlingError;
      }
      query.block_status = filter.block_status;
    } else {
      query.block_status = "ACTIVE";
    }
    const findBlocks = await Block.find(query);
    return findBlocks;
  } catch (error) {
    const handlingError = HandleCaughtError(error, "Failed to fetch blocks");
    throw handlingError;
  }
}

/**
 * Get a single block by ID with an optional status filter.
 *
 * This resolver fetches a single academic block from the database using its ID.
 * If a `block_status` filter is provided, the query will only match blocks with that status.
 * If no filter is specified, it defaults to querying blocks with status `ACTIVE`.
 *
 * @param {Object} _ - Unused parent resolver argument (per GraphQL convention).
 * @param {Object} args - Arguments passed to the query.
 * @param {string} args.id - The ID of the block to retrieve.
 * @param {Object} args.filter - Optional filter object.
 * @param {string} args.filter.block_status - Filter by block status (e.g., 'ACTIVE', 'ARCHIVED', 'DELETED').
 *
 * @returns {Promise<Object>} A promise resolving to the matched Block document.
 *
 * @throws {AppError} If the provided block_status is invalid or the block is not found.
 */

async function GetOneBlock(_, { id, filter }) {
  try {
    const blockId = await ValidateMongoId(id);
    const query = { _id: blockId };

    if (filter && filter.block_status) {
      if (!VALID_STATUS.includes(filter.block_status)) {
        const handlingError = CreateAppError(
          "Invalid block_status filter value",
          "BAD_REQUEST",
          { block_status: filter.block_status }
        );
        throw handlingError;
      }
      query.block_status = filter.block_status;
    } else {
      query.block_status = "ACTIVE";
    }

    const block = await Block.findOne(query);
    if (!block) {
      const handlingError = CreateAppError("Block not found", "NOT_FOUND", {
        blockId,
      });
      throw handlingError;
    }

    return block;
  } catch (error) {
    const handlingError = HandleCaughtError(error, "Failed to fetch block");
    throw handlingError;
  }
}

// *************** MUTATION ***************

/**
 * Create a new block with validated input data.
 *
 * This resolver handles the creation of a new block entity in the system.
 * It first validates the input fields using `ValidateCreateBlock`, ensuring
 * that all required data is present and properly formatted. If validation passes,
 * it constructs the payload and stores the new block in the database.
 *
 * Optional fields like `description`, `end_date`, and `subjects` are defaulted to `null`
 * or an empty array if not provided.
 *
 * @param {Object} _ - Unused parent resolver argument (per GraphQL convention).
 * @param {Object} args - Arguments passed to the mutation.
 * @param {Object} args.input - Input object for creating a new block.
 * @param {string} args.input.name - Name of the block (required).
 * @param {string} [args.input.description] - Optional block description.
 * @param {string} args.input.block_status - Enum status of the block (ACTIVE, ARCHIVED, DELETED).
 * @param {string|Date} args.input.start_date - Start date of the block (required).
 * @param {string|Date} [args.input.end_date] - Optional end date of the block.
 * @param {string[]} [args.input.subjects] - Optional array of subject ObjectIds.
 * @param {string|Date} args.input.created_at - Creation timestamp (required).
 *
 * @returns {Promise<Object>} A promise that resolves to the newly created Block document.
 *
 * @throws {AppError} Throws `VALIDATION_ERROR` if input is invalid, or other error if creation fails.
 */

async function CreateBlock(_, { input }) {
  try {
    const {
      name,
      description,
      block_status,
      criteria,
      start_date,
      end_date,
      subjects,
    } = await ValidateCreateBlock(input);

    const blockInputPayload = {
      name,
      description: description ? description : null,
      block_status,
      criteria,
      start_date,
      end_date: end_date ? end_date : null,
      subjects: Array.isArray(subjects) ? subjects : [],
    };

    const CreateBlockResponse = await Block.create(blockInputPayload);
    return CreateBlockResponse;
  } catch (error) {
    const handlingError = HandleCaughtError(
      error,
      "Failed to create block",
      "VALIDATION_ERROR"
    );
    throw handlingError;
  }
}

/**
 * Update an existing block with new data.
 *
 * This resolver handles updating a block in the database based on the provided `id`.
 * It first validates the input fields through `ValidateUpdateBlock`, builds a sanitized
 * update payload, and applies the changes using MongoDB's `updateOne`. If the block is not found,
 * an error is thrown. Fields like `description`, `end_date`, and `subjects` are optional.
 *
 * @param {Object} _ - Unused parent resolver argument (GraphQL convention).
 * @param {Object} args - Arguments passed to the mutation.
 * @param {string} args.id - The ID of the block to update.
 * @param {Object} args.input - Input payload for updating the block.
 *
 * @returns {Promise<Object>} An object containing the updated block ID.
 *
 * @throws {AppError} Throws `NOT_FOUND` if the block is not found.
 * @throws {AppError} Throws `VALIDATION_ERROR` if input validation fails.
 */

async function UpdateBlock(_, { id, input }) {
  try {
    const {
      name,
      description,
      block_status,
      criteria,
      start_date,
      end_date,
      subjects,
    } = await ValidateUpdateBlock(input);
    const blockId = await ValidateMongoId(id);

    const blockUpdatePayload = {
      name,
      description: description ? description : null,
      block_status,
      criteria,
      start_date,
      end_date: end_date ? end_date : null,
      subjects: Array.isArray(subjects) ? subjects : [],
    };

    const updated = await Block.updateOne(
      { _id: blockId },
      { $set: blockUpdatePayload }
    );

    if (!updated) {
      throw CreateAppError("Block not updated", "NOT_FOUND", { blockId });
    }
    const updateBlockResponse = { id: blockId };
    return updateBlockResponse;
  } catch (error) {
    const handlingError = HandleCaughtError(
      error,
      "Failed to update block",
      "VALIDATION_ERROR"
    );
    throw handlingError;
  }
}

/**
 * Soft delete a block by marking its status as `DELETED`.
 *
 * This resolver performs a soft delete operation by updating the `block_status` to `DELETED`,
 * along with setting the `deleted_at` timestamp and optionally the `deleted_by` user ID.
 * It only applies the update if the block is not already marked as `DELETED`.
 *
 * @param {Object} _ - Unused parent resolver argument (GraphQL convention).
 * @param {Object} args - Arguments passed to the mutation.
 * @param {string} args.id - The ID of the block to soft delete.
 * @param {string} [args.deleted_by] - Optional ID of the user performing the deletion.
 *
 * @returns {Promise<Object>} An object containing the ID of the deleted block.
 *
 * @throws {AppError} Throws `NOT_FOUND` if the block does not exist or is already deleted.
 */

async function DeleteBlock(_, { id, deleted_by }) {
  try {
    const blockId = await ValidateMongoId(id);

    const deleted = await Block.updateOne(
      { _id: blockId, block_status: { $ne: "DELETED" } },
      {
        $set: {
          block_status: "DELETED",
          deleted_at: new Date(),
          deleted_by: deleted_by ? deleted_by : null,
        },
      }
    );

    if (!deleted) {
      throw CreateAppError("Block not found", "NOT_FOUND", { blockId });
    }

    const deleteBlockResponse = { id: blockId };
    return deleteBlockResponse;
  } catch (error) {
    const handlingError = HandleCaughtError(error, "Failed to delete block");
    throw handlingError;
  }
}

// *************** LOADER ***************
/**
 * Resolver function to load subjects associated with a block.
 * Utilizes DataLoader to batch and cache requests for subjects.
 *
 * @param {Object} block - The parent block object containing subject IDs.
 * @param {Object} _ - GraphQL resolver unused argument (args).
 * @param {Object} context - GraphQL context object containing DataLoaders.
 * @param {Object} context.loaders - DataLoader registry.
 * @param {DataLoader} context.loaders.block - DataLoader instance for subjects.
 *
 * @throws {Error} Throws an error if the subject loader is not initialized.
 *
 * @returns {Promise<Array<Object>>} Returns a promise resolving to an array of subject documents.
 */
function subjects(block, _, context) {
  if (!context && !context.loaders && !context.loaders.block) {
    throw new Error("Student loader not initialized");
  }

  const blockIds = block.subjects ? block.subjects.map((id) => String(id)) : [];
  const subjectLoaderResponse = context.loaders.block.loadMany(blockIds);
  return subjectLoaderResponse;
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllBlocks,
    GetOneBlock,
  },
  Mutation: {
    CreateBlock,
    UpdateBlock,
    DeleteBlock,
  },
  Block: {
    subjects,
  },
};

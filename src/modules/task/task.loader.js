// *************** IMPORT LIBRARY ***************
const DataLoader = require("dataloader");

// *************** IMPORT MODULE ***************
const Task = require("./task.model");

/**
 * Batches and returns task documents corresponding to an array of task IDs.
 *
 * This function is typically used with DataLoader to batch and cache requests for tasks
 * by their `_id` values. It performs a single database query to retrieve all matching
 * tasks and then maps the result back to the original input order.
 *
 * @async
 * @function BatchTaskById
 * @param {string[]} task_ids - An array of task IDs to fetch from the database.
 *
 * @returns {Promise<Object[]>} A promise that resolves to an array of task documents,
 * mapped in the same order as the input `task_ids` array. If a task is not found,
 * its corresponding slot will be null.
 */

async function BatchTaskById(task_ids) {
  const tasks = await Task.find({
    _id: { $in: task_ids },
  });

  return task_ids.map((id) =>
    tasks.find((task) => String(task._id) === String(id))
  );
}

// *************** LOADER ***************
function TaskLoader() {
  return new DataLoader(BatchTaskById);
}

// *************** EXPORT MODULE ***************
module.exports = { TaskLoader };

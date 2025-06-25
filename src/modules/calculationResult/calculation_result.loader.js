// *************** IMPORT CORE ***************

const { Loaders } = require("../../core/loader");

const UniqueIds = (id) => [...new Set(id.map(String))];

/**
 * @param {Array<ObjectId>} test_ids
 * @returns {Promise<Array>}
 */

async function LoadTestsByIds(test_ids) {
  const testIds = UniqueIds(test_ids);
  return await Loaders.test.loadMany(testIds);
}
/**
 * @param {Array<ObjectId>} subject_ids
 * @returns {Promise<Array>}
 */

async function LoadSubjectsByIds(subject_ids) {
  const subjectIds = UniqueIds(subject_ids);
  return await Loaders.subject.loadMany(subjectIds);
}

/**
 * @param {Array<ObjectId>} block_ids
 * @returns {Promise<Array>}
 */

async function LoadBlocksByIds(block_ids) {
  const blockIds = UniqueIds(block_ids);
  return await Loaders.block.loadMany(blockIds);
}

module.exports = {
  LoadTestsByIds,
  LoadSubjectsByIds,
  LoadBlocksByIds,
};

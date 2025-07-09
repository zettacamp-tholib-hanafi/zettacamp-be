// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT UTILITIES ***************
const { USER } = require("../../shared/utils/enum");

const MAX_LIMIT = 10;

/**
 * Build a $match stage for user filtering.
 *
 * @param {Object} filter - Filter object
 * @param {ObjectId} [fixedId] - Optional _id to match (for GetOneUser)
 * @returns {Object} matchStage object
 */
function UserFilterStage(filter = {}, fixedId = null) {
  const matchStage = {};

  if (fixedId) {
    matchStage._id = fixedId;
  }

  if (filter.user_status) {
    if (!USER.VALID_STATUS.includes(filter.user_status)) {
      throw CreateAppError("Invalid user_status", "BAD_REQUEST", {
        user_status: filter.user_status,
      });
    }
    matchStage.user_status = filter.user_status;
  }

  if (filter.role && Array.isArray(filter.role) && filter.role.length > 0) {
    const invalidRoles = filter.role.filter(
      (role) => !USER.VALID_ROLE.includes(role)
    );
    if (invalidRoles.length > 0) {
      throw CreateAppError("Invalid role filter value", "BAD_REQUEST", {
        invalid_roles: invalidRoles,
      });
    }
    matchStage.role = { $in: filter.role };
  }

  if (filter.created_at) {
    const createdAt = {};

    if (filter.created_at.eq) {
      if (filter.created_at.eq && isNaN(Date.parse(filter.created_at.eq))) {
        throw CreateAppError("Invalid date format in eq", "BAD_REQUEST");
      }
      const eqDate = new Date(filter.created_at.eq);
      const nextDay = new Date(eqDate);
      nextDay.setDate(eqDate.getDate() + 1);
      createdAt.$gte = eqDate;
      createdAt.$lt = nextDay;
    }
    if (filter.created_at.gte) {
      if (filter.created_at.gte && isNaN(Date.parse(filter.created_at.gte))) {
        throw CreateAppError("Invalid date format in gte", "BAD_REQUEST");
      }
      createdAt.$gte = new Date(filter.created_at.gte);
    }
    if (filter.created_at.gt) {
      if (filter.created_at.gt && isNaN(Date.parse(filter.created_at.gt))) {
        throw CreateAppError("Invalid date format in gt", "BAD_REQUEST");
      }
      createdAt.$gt = new Date(filter.created_at.gt);
    }
    if (filter.created_at.lte) {
      if (filter.created_at.lte && isNaN(Date.parse(filter.created_at.lte))) {
        throw CreateAppError("Invalid date format in lte", "BAD_REQUEST");
      }
      createdAt.$lte = new Date(filter.created_at.lte);
    }
    if (filter.created_at.lt) {
      if (filter.created_at.lt && isNaN(Date.parse(filter.created_at.lt))) {
        throw CreateAppError("Invalid date format in lt", "BAD_REQUEST");
      }
      createdAt.$lt = new Date(filter.created_at.lt);
    }

    if (Object.keys(createdAt).length > 0) {
      matchStage.created_at = createdAt;
    }
  }

  return matchStage;
}

/**
 * Builds aggregation pipeline for GetAllUsers with filter, sort, pagination.
 *
 * @param {Object} filter
 * @param {Object} sort
 * @param {Object} pagination
 * @returns {Object} { pipeline, page, limit }
 */
function UserQueryPipeline(filter = {}, sort = {}, pagination = {}) {
  const pipeline = [];

  const matchStage = UserFilterStage(filter);
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  const sortField = sort.field || "created_at";
  const sortOrder = sort.order === "ASC" ? 1 : -1;
  const allowedSortFields = ["first_name", "last_name", "email", "created_at"];
  if (sortField && !allowedSortFields.includes(sortField)) {
    throw CreateAppError("Invalid sort field", "BAD_REQUEST", {
      field: sortField,
    });
  }

  pipeline.push({ $sort: { [sortField]: sortOrder } });

  const page =
    Number.isInteger(pagination.page) && pagination.page > 0
      ? pagination.page
      : 1;
  const limit =
    Number.isInteger(pagination.limit) && pagination.limit > 0
      ? pagination.limit
      : MAX_LIMIT;
  const skip = (page - 1) * limit;

  pipeline.push({
    $facet: {
      data: [{ $skip: skip }, { $limit: limit }],
      metadata: [{ $count: "total" }],
    },
  });

  return { pipeline, page, limit };
}

// *************** EXPORT MODULE ***************
module.exports = {
  UserFilterStage,
  UserQueryPipeline,
};

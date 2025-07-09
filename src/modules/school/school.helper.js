// *************** IMPORT CORE ***************
const { default: mongoose } = require("mongoose");
const { CreateAppError } = require("../../core/error");

// *************** IMPORT UTILITIES ***************
const { SCHOOL } = require("../../shared/utils/enum");
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id");

const MAX_LIMIT = 10;

/**
 * Build a $match stage for school filtering.
 *
 * @param {Object} filter - Filter object
 * @returns {Object} matchStage object
 */
async function SchoolFilterStage(filter = {}) {
  const matchStage = {};

  if (filter.school_status) {
    if (!SCHOOL.VALID_STATUS.includes(filter.school_status)) {
      throw CreateAppError("Invalid school_status", "BAD_REQUEST", {
        school_status: filter.school_status,
      });
    }
    matchStage.school_status = filter.school_status;
  }
  if (filter.status_verified !== undefined) {
    if (typeof filter.status_verified !== "boolean") {
      throw CreateAppError("Invalid status_verified", "BAD_REQUEST", {
        status_verified: filter.status_verified,
      });
    }

    matchStage["verified.status_verified"] = filter.status_verified;
  }

  if (filter.verified_at) {
    const verifiedAt = {};

    if (filter.verified_at.eq) {
      const eqDate = parseDateField(filter.verified_at.eq, "eq");
      const nextDay = new Date(eqDate);
      nextDay.setDate(eqDate.getDate() + 1);
      verifiedAt.$gte = eqDate;
      verifiedAt.$lt = nextDay;
    }

    if (filter.verified_at.gte) {
      verifiedAt.$gte = parseDateField(filter.verified_at.gte, "gte");
    }

    if (filter.verified_at.gt) {
      verifiedAt.$gt = parseDateField(filter.verified_at.gt, "gt");
    }

    if (filter.verified_at.lte) {
      verifiedAt.$lte = parseDateField(filter.verified_at.lte, "lte");
    }

    if (filter.verified_at.lt) {
      verifiedAt.$lt = parseDateField(filter.verified_at.lt, "lt");
    }

    if (Object.keys(verifiedAt).length > 0) {
      matchStage["verified.verified_at"] = verifiedAt;
    }
  }

  if (filter.admin_user_id) {
    try {
      const validSchoolId = await ValidateMongoId(filter.admin_user_id);
      matchStage["admin_user.id"] = new mongoose.Types.ObjectId(validSchoolId);
    } catch {
      throw CreateAppError("Invalid admin_user_id", "BAD_REQUEST");
    }
  }

  return matchStage;
}

/**
 * Builds aggregation pipeline for GetAllSchools with filter, sort, pagination.
 *
 * @param {Object} filter
 * @param {Object} sort
 * @param {Object} pagination
 * @returns {Object} { pipeline, page, limit }
 */
async function SchoolQueryPipeline(filter = {}, sort = {}, pagination = {}) {
  const pipeline = [];

  pipeline.push({
    $lookup: {
      from: "users",
      localField: "admin_user.id",
      foreignField: "_id",
      as: "user",
    },
  });

  pipeline.push({
    $unwind: {
      path: "$user",
      preserveNullAndEmptyArrays: true,
    },
  });

  const matchStage = await SchoolFilterStage(filter);

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  if (filter.admin_user_email) {
    pipeline.push({
        $match: {
          "user.email": filter.admin_user_email,
        },
    });
  }
  const sortField = sort.field || "created_at";
  const sortOrder = sort.order === "ASC" ? 1 : -1;
  const allowedSortFields = [
    "short_name",
    "long_name",
    "created_at",
    "updated_at",
  ];
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

/**
 * Convert a date string into a Date object.
 * Throws error if the format is invalid.
 *
 * @param {string} dateStr - The date string to parse.
 * @param {string} label - Field name for error context.
 * @returns {Date} Parsed Date object.
 */

function parseDateField(dateStr, label) {
  const date = new Date(dateStr);
  if (isNaN(date))
    throw CreateAppError(`Invalid date format in ${label}`, "BAD_REQUEST");
  return date;
}

// *************** EXPORT MODULE ***************
module.exports = {
  SchoolQueryPipeline,
};

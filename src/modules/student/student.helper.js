// *************** IMPORT LIBRARY ***************
const { default: mongoose } = require("mongoose");

// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error");

// *************** IMPORT UTILITIES ***************
const { STUDENT } = require("../../shared/utils/enum");
const { ValidateMongoId } = require("../../shared/utils/validate_mongo_id");

const MAX_LIMIT = 10;

/**
 * Build a $match stage for student filtering.
 *
 * @param {Object} filter - Filter object
 * @returns {Object} matchStage object
 */
async function StudentFilterStage(filter = {}) {
  const matchStage = {};

  if (filter.student_status) {
    if (!STUDENT.VALID_STATUS.includes(filter.student_status)) {
      throw CreateAppError("Invalid student_status", "BAD_REQUEST", {
        student_status: filter.student_status,
      });
    }
    matchStage.student_status = filter.student_status;
  }
  if (filter.academic_status) {
    if (!STUDENT.VALID_ACADEMIC_STATUS.includes(filter.academic_status)) {
      throw CreateAppError("Invalid academic_status", "BAD_REQUEST", {
        academic_status: filter.academic_status,
      });
    }
    matchStage.academic_status = filter.academic_status;
  }

  if (filter.gender) {
    if (!STUDENT.VALID_GENDER.includes(filter.gender)) {
      throw CreateAppError("Invalid Gender", "BAD_REQUEST", {
        gender: filter.gender,
      });
    }
    matchStage.gender = filter.gender;
  }

  if (filter.date_of_birth) {
    const dateOfBirth = {};

    if (filter.date_of_birth.eq) {
      const eqDate = parseDateField(filter.date_of_birth.eq, "eq");
      const nextDay = new Date(eqDate);
      nextDay.setDate(eqDate.getDate() + 1);
      dateOfBirth.$gte = eqDate;
      dateOfBirth.$lt = nextDay;
    }

    if (filter.date_of_birth.gte) {
      dateOfBirth.$gte = parseDateField(filter.date_of_birth.gte, "gte");
    }

    if (filter.date_of_birth.gt) {
      dateOfBirth.$gt = parseDateField(filter.date_of_birth.gt, "gt");
    }

    if (filter.date_of_birth.lte) {
      dateOfBirth.$lte = parseDateField(filter.date_of_birth.lte, "lte");
    }

    if (filter.date_of_birth.lt) {
      dateOfBirth.$lt = parseDateField(filter.date_of_birth.lt, "lt");
    }

    if (Object.keys(dateOfBirth).length > 0) {
      matchStage["birth.date"] = dateOfBirth;
    }
  }

  if (filter.school_id) {
    try {
      const validSchoolId = await ValidateMongoId(filter.school_id);
      matchStage.school_id = new mongoose.Types.ObjectId(validSchoolId);
    } catch {
      throw CreateAppError("Invalid school_id", "BAD_REQUEST");
    }
  }

  return matchStage;
}

/**
 * Builds aggregation pipeline for GetAllStudents with filter, sort, pagination.
 *
 * @param {Object} filter
 * @param {Object} sort
 * @param {Object} pagination
 * @returns {Object} { pipeline, page, limit }
 */
async function StudentQueryPipeline(filter = {}, sort = {}, pagination = {}) {
  const pipeline = [];

  pipeline.push({
    $lookup: {
      from: "schools",
      localField: "school_id",
      foreignField: "_id",
      as: "school",
    },
  });

  pipeline.push({
    $unwind: {
      path: "$school",
      preserveNullAndEmptyArrays: true,
    },
  });

  const matchStage = await StudentFilterStage(filter);

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  if (filter.school_name) {
    pipeline.push({
      $match: {
        $or: [
          {
            "school.short_name": {
              $regex: filter.school_name,
              $options: "i",
            },
          },
          {
            "school.long_name": {
              $regex: filter.school_name,
              $options: "i",
            },
          },
        ],
      },
    });
  }
  const sortField = sort.field || "created_at";
  const sortOrder = sort.order === "ASC" ? 1 : -1;
  const allowedSortFields = [
    "first_name",
    "last_name",
    "email",
    "created_at",
    "date_of_birth",
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
  console.log("PIPELINE", pipeline);

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
  StudentFilterStage,
  StudentQueryPipeline,
};

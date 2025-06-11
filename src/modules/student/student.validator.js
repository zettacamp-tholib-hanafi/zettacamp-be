// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT CORE ***************
const { CreateAppError } = require("../../core/error.js");

const VALID_GENDERS = ["MALE", "FEMALE"];
const VALID_STATUSES = ["ACTIVE", "PENDING", "DELETED"];
const VALID_ACADEMIC_STATUS = [
  "ENROLLED",
  "GRADUATED",
  "DROPPED_OUT",
  "TRANSFERRED",
];

// *************** Constant Regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;
const URL_REGEX =
  /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/;

/**
 * Validates input for creating a new student.
 *
 * This function checks for the presence and validity of required fields like
 * first name, last name, email, gender, birth info, student status, and school ID.
 * It also validates optional fields like phone number, profile picture URL, and
 * academic status-related dates. Throws descriptive errors if any validations fail.
 *
 * @param {Object} input - The input data for creating a student.
 * @param {string} input.first_name - Required. First name of the student.
 * @param {string} input.last_name - Required. Last name of the student.
 * @param {string} input.email - Required. Must be a valid email.
 * @param {string} [input.phone] - Optional. Must be a valid phone number.
 * @param {string} [input.profile_picture_url] - Optional. Must be a valid URL.
 * @param {string} input.gender - Required. Must be one of the valid gender options.
 * @param {Object} input.birth - Required. Contains place and date of birth.
 * @param {string} input.birth.place - Required. Birth place as a string.
 * @param {string|Date} input.birth.date - Required. Must be a valid date.
 * @param {string} input.student_status - Required. Must be one of the allowed statuses.
 * @param {boolean} input.scholarship - Required. Must be a boolean.
 * @param {string} [input.academic_status] - Optional. Must be a valid academic status.
 * @param {string} input.school_id - Required. Must be a valid MongoDB ObjectId.
 * @param {string} [input.enrollment_date] - Conditionally required based on academic_status.
 * @param {string} [input.graduation_date] - Conditionally required based on academic_status.
 * @param {string} [input.dropped_out_date] - Conditionally required based on academic_status.
 * @param {string} [input.transferred_date] - Conditionally required based on academic_status.
 *
 * @throws {AppError} If any validation fails.
 */

function ValidateCreateStudentInput(input) {
  const {
    first_name,
    last_name,
    email,
    phone,
    profile_picture_url,
    gender,
    birth,
    student_status,
    scholarship,
    academic_status,
    school_id,
  } = input;

  if (!first_name || typeof first_name !== "string") {
    throw CreateAppError(
      "First name is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "first_name" }
    );
  }

  if (!last_name || typeof last_name !== "string") {
    throw CreateAppError(
      "Last name is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "last_name" }
    );
  }

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw CreateAppError(
      "Email is required and must be a valid format.",
      "VALIDATION_ERROR",
      { field: "email" }
    );
  }

  if (!school_id || !isValidObjectId(school_id)) {
    throw CreateAppError(
      "School ID is required and must be a valid ObjectId.",
      "VALIDATION_ERROR",
      { field: "school_id" }
    );
  }

  if (!gender || !VALID_GENDERS.includes(gender)) {
    throw CreateAppError(
      `Gender must be one of: ${VALID_GENDERS.join(", ")}`,
      "VALIDATION_ERROR",
      { field: "gender" }
    );
  }

  if (!birth || typeof birth !== "object") {
    throw CreateAppError(
      "Birth is required and must be an object with place and date.",
      "VALIDATION_ERROR",
      { field: "birth" }
    );
  }

  if (!birth.place || typeof birth.place !== "string") {
    throw CreateAppError(
      "Birth place is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "birth.place" }
    );
  }

  if (!birth.date || isNaN(new Date(birth.date).getTime())) {
    throw CreateAppError(
      "Birth date is required and must be a valid date.",
      "VALIDATION_ERROR",
      { field: "birth.date" }
    );
  }

  if (!student_status || !VALID_STATUSES.includes(student_status)) {
    throw CreateAppError(
      `Student status must be one of: ${VALID_STATUSES.join(", ")}`,
      "VALIDATION_ERROR",
      { field: "student_status" }
    );
  }

  if (typeof scholarship !== "boolean") {
    throw CreateAppError(
      "Scholarship is required and must be a boolean.",
      "VALIDATION_ERROR",
      { field: "scholarship" }
    );
  }

  if (phone && !PHONE_REGEX.test(phone + "")) {
    throw CreateAppError(
      "Phone must be a valid mobile number.",
      "VALIDATION_ERROR",
      { field: "phone" }
    );
  }

  if (profile_picture_url && !URL_REGEX.test(profile_picture_url)) {
    throw CreateAppError(
      "Profile picture URL must be a valid URL.",
      "VALIDATION_ERROR",
      { field: "profile_picture_url" }
    );
  }

  if (academic_status && !VALID_ACADEMIC_STATUS.includes(academic_status)) {
    throw CreateAppError(
      `Academic status must be one of: ${VALID_ACADEMIC_STATUS.join(", ")}`,
      "VALIDATION_ERROR",
      { field: "academic_status" }
    );
  }

  const academicDateFields = {
    ENROLLED: "enrollment_date",
    GRADUATED: "graduation_date",
    DROPPED_OUT: "dropped_out_date",
    TRANSFERRED: "transferred_date",
  };

  if (academic_status) {
    const requiredField = academicDateFields[academic_status];
    const dateValue = input[requiredField];
    if (!dateValue || isNaN(new Date(dateValue).getTime())) {
      throw CreateAppError(
        `${requiredField} must be a valid date when academic_status is '${academic_status}'.`,
        "VALIDATION_ERROR",
        { field: requiredField }
      );
    }

    Object.entries(academicDateFields).forEach(([status, field]) => {
      if (status !== academic_status && input[field]) {
        throw CreateAppError(
          `${field} must not be provided when academic_status is '${academic_status}'.`,
          "VALIDATION_ERROR",
          { field }
        );
      }
    });
  }
}

/**
 * Validates input for updating an existing student.
 *
 * This function checks each optional field if present and validates them accordingly.
 * Fields include names, email, phone, profile picture, gender, birth, student status,
 * scholarship, and academic status. It also ensures academic date fields are used properly.
 *
 * @param {Object} input - The input data for updating a student.
 * @param {string} [input.first_name] - Optional. Must be a string.
 * @param {string} [input.last_name] - Optional. Must be a string.
 * @param {string} [input.email] - Optional. Must be a valid email format.
 * @param {string} [input.phone] - Optional. Must be a valid phone number.
 * @param {string} [input.profile_picture_url] - Optional. Must be a valid URL.
 * @param {string} [input.gender] - Optional. Must be one of the valid gender options.
 * @param {Object} [input.birth] - Optional. Contains optional place and/or date.
 * @param {string} [input.birth.place] - Optional. Must be a string.
 * @param {string|Date} [input.birth.date] - Optional. Must be a valid date.
 * @param {string} [input.student_status] - Optional. Must be a valid status.
 * @param {boolean} [input.scholarship] - Optional. Must be a boolean if present.
 * @param {string} [input.academic_status] - Optional. Must be a valid academic status.
 * @param {string} [input.school_id] - Optional. Must be a valid MongoDB ObjectId.
 * @param {string} [input.enrollment_date] - Conditionally required based on academic_status.
 * @param {string} [input.graduation_date] - Conditionally required based on academic_status.
 * @param {string} [input.dropped_out_date] - Conditionally required based on academic_status.
 * @param {string} [input.transferred_date] - Conditionally required based on academic_status.
 *
 * @throws {AppError} If any validation fails.
 */

function ValidateUpdateStudentInput(input) {
  const {
    first_name,
    last_name,
    email,
    phone,
    profile_picture_url,
    gender,
    birth,
    student_status,
    scholarship,
    academic_status,
    school_id,
  } = input;

  if (first_name && typeof first_name !== "string") {
    throw CreateAppError("First name must be a string.", "VALIDATION_ERROR", {
      field: "first_name",
    });
  }

  if (last_name && typeof last_name !== "string") {
    throw CreateAppError("Last name must be a string.", "VALIDATION_ERROR", {
      field: "last_name",
    });
  }

  if (email) {
    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      throw CreateAppError(
        "Email must be a valid format.",
        "VALIDATION_ERROR",
        { field: "email" }
      );
    }
  }

  if (school_id && !isValidObjectId(school_id)) {
    throw CreateAppError(
      "School ID must be a valid ObjectId.",
      "VALIDATION_ERROR",
      { field: "school_id" }
    );
  }

  if (gender && !VALID_GENDERS.includes(gender)) {
    throw CreateAppError(
      `Gender must be one of: ${VALID_GENDERS.join(", ")}`,
      "VALIDATION_ERROR",
      { field: "gender" }
    );
  }

  if (birth) {
    if (typeof birth !== "object") {
      throw CreateAppError("Birth must be an object.", "VALIDATION_ERROR", {
        field: "birth",
      });
    }

    if (birth.place && typeof birth.place !== "string") {
      throw CreateAppError(
        "Birth place must be a string.",
        "VALIDATION_ERROR",
        { field: "birth.place" }
      );
    }

    if (birth.date && isNaN(new Date(birth.date).getTime())) {
      throw CreateAppError(
        "Birth date must be a valid date.",
        "VALIDATION_ERROR",
        { field: "birth.date" }
      );
    }
  }

  if (student_status && !VALID_STATUSES.includes(student_status)) {
    throw CreateAppError(
      `Student status must be one of: ${VALID_STATUSES.join(", ")}`,
      "VALIDATION_ERROR",
      { field: "student_status" }
    );
  }

  if (scholarship !== undefined && typeof scholarship !== "boolean") {
    throw CreateAppError("Scholarship must be a boolean.", "VALIDATION_ERROR", {
      field: "scholarship",
    });
  }

  if (phone && !PHONE_REGEX.test(phone + "")) {
    throw CreateAppError(
      "Phone must be a valid mobile number.",
      "VALIDATION_ERROR",
      { field: "phone" }
    );
  }

  if (profile_picture_url && !URL_REGEX.test(profile_picture_url)) {
    throw CreateAppError(
      "Profile picture URL must be a valid URL.",
      "VALIDATION_ERROR",
      { field: "profile_picture_url" }
    );
  }

  if (academic_status && !VALID_ACADEMIC_STATUS.includes(academic_status)) {
    throw CreateAppError(
      `Academic status must be one of: ${VALID_ACADEMIC_STATUS.join(", ")}`,
      "VALIDATION_ERROR",
      { field: "academic_status" }
    );
  }

  const academicDateFields = {
    ENROLLED: "enrollment_date",
    GRADUATED: "graduation_date",
    DROPPED_OUT: "dropped_out_date",
    TRANSFERRED: "transferred_date",
  };

  if (academic_status) {
    const requiredField = academicDateFields[academic_status];
    const dateValue = input[requiredField];
    if (!dateValue || isNaN(new Date(dateValue).getTime())) {
      throw CreateAppError(
        `${requiredField} must be a valid date when academic_status is '${academic_status}'.`,
        "VALIDATION_ERROR",
        { field: requiredField }
      );
    }

    Object.entries(academicDateFields).forEach(([status, field]) => {
      if (status !== academic_status && input[field]) {
        throw CreateAppError(
          `${field} must not be provided when academic_status is '${academic_status}'.`,
          "VALIDATION_ERROR",
          { field }
        );
      }
    });
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateCreateStudentInput,
  ValidateUpdateStudentInput,
};

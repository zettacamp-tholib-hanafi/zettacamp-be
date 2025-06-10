// *************** IMPORT LIBRARY ***************
const { isValidObjectId } = require("mongoose");

// *************** IMPORT UTILITIES ***************
const { createAppError } = require("../../utils/ErrorFormat.js");

// *************** CONSTANTS
const VALID_GENDERS = ["MALE", "FEMALE"];
const VALID_STATUSES = ["ACTIVE", "PENDING", "DELETED"];
const VALID_ACADEMIC_STATUS = [
  "ENROLLED",
  "GRADUATED",
  "DROPPED_OUT",
  "TRANSFERRED",
];

// *************** REGEX VALIDATORS ***************
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;
const URL_REGEX =
  /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/;

// *************** VALIDATE CREATE STUDENT INPUT ***************
function validateCreateStudentInput(input) {
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
    throw createAppError(
      "First name is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "first_name" }
    );
  }

  if (!last_name || typeof last_name !== "string") {
    throw createAppError(
      "Last name is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "last_name" }
    );
  }

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw createAppError(
      "Email is required and must be a valid format.",
      "VALIDATION_ERROR",
      { field: "email" }
    );
  }

  if (!school_id || !isValidObjectId(school_id)) {
    throw createAppError(
      "School ID is required and must be a valid ObjectId.",
      "VALIDATION_ERROR",
      { field: "school_id" }
    );
  }

  if (!gender || !VALID_GENDERS.includes(gender)) {
    throw createAppError(
      `Gender must be one of: ${VALID_GENDERS.join(", ")}`,
      "VALIDATION_ERROR",
      { field: "gender" }
    );
  }

  if (!birth || typeof birth !== "object") {
    throw createAppError(
      "Birth is required and must be an object with place and date.",
      "VALIDATION_ERROR",
      { field: "birth" }
    );
  }

  if (!birth.place || typeof birth.place !== "string") {
    throw createAppError(
      "Birth place is required and must be a string.",
      "VALIDATION_ERROR",
      { field: "birth.place" }
    );
  }

  if (!birth.date || isNaN(new Date(birth.date).getTime())) {
    throw createAppError(
      "Birth date is required and must be a valid date.",
      "VALIDATION_ERROR",
      { field: "birth.date" }
    );
  }

  if (!student_status || !VALID_STATUSES.includes(student_status)) {
    throw createAppError(
      `Student status must be one of: ${VALID_STATUSES.join(", ")}`,
      "VALIDATION_ERROR",
      { field: "student_status" }
    );
  }

  if (typeof scholarship !== "boolean") {
    throw createAppError(
      "Scholarship is required and must be a boolean.",
      "VALIDATION_ERROR",
      { field: "scholarship" }
    );
  }

  if (phone && !PHONE_REGEX.test(phone + "")) {
    throw createAppError(
      "Phone must be a valid mobile number.",
      "VALIDATION_ERROR",
      { field: "phone" }
    );
  }

  if (profile_picture_url && !URL_REGEX.test(profile_picture_url)) {
    throw createAppError(
      "Profile picture URL must be a valid URL.",
      "VALIDATION_ERROR",
      { field: "profile_picture_url" }
    );
  }

  if (academic_status && !VALID_ACADEMIC_STATUS.includes(academic_status)) {
    throw createAppError(
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
      throw createAppError(
        `${requiredField} must be a valid date when academic_status is '${academic_status}'.`,
        "VALIDATION_ERROR",
        { field: requiredField }
      );
    }

    Object.entries(academicDateFields).forEach(([status, field]) => {
      if (status !== academic_status && input[field]) {
        throw createAppError(
          `${field} must not be provided when academic_status is '${academic_status}'.`,
          "VALIDATION_ERROR",
          { field }
        );
      }
    });
  }
}

// *************** VALIDATE UPDATE STUDENT INPUT ***************
function validateUpdateStudentInput(input) {
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
    throw createAppError("First name must be a string.", "VALIDATION_ERROR", {
      field: "first_name",
    });
  }

  if (last_name && typeof last_name !== "string") {
    throw createAppError("Last name must be a string.", "VALIDATION_ERROR", {
      field: "last_name",
    });
  }

  if (email) {
    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      throw createAppError(
        "Email must be a valid format.",
        "VALIDATION_ERROR",
        { field: "email" }
      );
    }
  }

  if (school_id && !isValidObjectId(school_id)) {
    throw createAppError(
      "School ID must be a valid ObjectId.",
      "VALIDATION_ERROR",
      { field: "school_id" }
    );
  }

  if (gender && !VALID_GENDERS.includes(gender)) {
    throw createAppError(
      `Gender must be one of: ${VALID_GENDERS.join(", ")}`,
      "VALIDATION_ERROR",
      { field: "gender" }
    );
  }

  if (birth) {
    if (typeof birth !== "object") {
      throw createAppError("Birth must be an object.", "VALIDATION_ERROR", {
        field: "birth",
      });
    }

    if (birth.place && typeof birth.place !== "string") {
      throw createAppError(
        "Birth place must be a string.",
        "VALIDATION_ERROR",
        { field: "birth.place" }
      );
    }

    if (birth.date && isNaN(new Date(birth.date).getTime())) {
      throw createAppError(
        "Birth date must be a valid date.",
        "VALIDATION_ERROR",
        { field: "birth.date" }
      );
    }
  }

  if (student_status && !VALID_STATUSES.includes(student_status)) {
    throw createAppError(
      `Student status must be one of: ${VALID_STATUSES.join(", ")}`,
      "VALIDATION_ERROR",
      { field: "student_status" }
    );
  }

  if (scholarship !== undefined && typeof scholarship !== "boolean") {
    throw createAppError("Scholarship must be a boolean.", "VALIDATION_ERROR", {
      field: "scholarship",
    });
  }

  if (phone && !PHONE_REGEX.test(phone + "")) {
    throw createAppError(
      "Phone must be a valid mobile number.",
      "VALIDATION_ERROR",
      { field: "phone" }
    );
  }

  if (profile_picture_url && !URL_REGEX.test(profile_picture_url)) {
    throw createAppError(
      "Profile picture URL must be a valid URL.",
      "VALIDATION_ERROR",
      { field: "profile_picture_url" }
    );
  }

  if (academic_status && !VALID_ACADEMIC_STATUS.includes(academic_status)) {
    throw createAppError(
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
      throw createAppError(
        `${requiredField} must be a valid date when academic_status is '${academic_status}'.`,
        "VALIDATION_ERROR",
        { field: requiredField }
      );
    }

    Object.entries(academicDateFields).forEach(([status, field]) => {
      if (status !== academic_status && input[field]) {
        throw createAppError(
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
  validateCreateStudentInput,
  validateUpdateStudentInput,
};

// *************** IMPORT LIBRARY ***************

const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************

module.exports = gql`
  enum StudentGender {
    MALE
    FEMALE
  }

  enum StudentStatus {
    PENDING
    ACTIVE
    DELETED
  }

  enum AcademicStatus {
    ENROLLED
    GRADUATED
    DROPPED_OUT
    TRANSFERRED
  }

  type StudentBirth {
    place: String!
    date: Date!
  }

  type Student {
    id: ID!
    first_name: String!
    last_name: String!
    email: String!
    phone: String
    profile_picture_url: String
    school_id: ID!
    school: School
    student_number: String
    gender: StudentGender!
    birth: StudentBirth!
    student_status: StudentStatus!
    scholarship: Boolean!
    academic_status: AcademicStatus
    enrollment_date: Date
    graduation_date: Date
    dropped_out_date: Date
    transferred_date: Date
    updated_at: Date
    updated_by: String
    created_at: Date
    created_by: String
    deleted_at: Date
    deleted_by: String
  }

  type StudentPaginationResult {
    data: [Student!]
    meta: PaginationResult!
  }

  input StudentBirthInput {
    place: String!
    date: Date!
  }

  input CreateStudentInput {
    first_name: String!
    last_name: String!
    email: String!
    phone: String
    profile_picture_url: String
    school_id: ID!
    student_number: String
    gender: StudentGender!
    birth: StudentBirthInput!
    student_status: StudentStatus!
    scholarship: Boolean!
    academic_status: AcademicStatus
    enrollment_date: Date
    graduation_date: Date
    dropped_out_date: Date
    transferred_date: Date
    created_at: Date
    created_by: String
    updated_at: Date
    updated_by: String
  }

  input UpdateStudentInput {
    first_name: String
    last_name: String
    email: String
    phone: String
    profile_picture_url: String
    school_id: ID
    student_number: String
    gender: StudentGender
    birth: StudentBirthInput
    student_status: StudentStatus
    scholarship: Boolean
    academic_status: AcademicStatus
    enrollment_date: Date
    graduation_date: Date
    dropped_out_date: Date
    transferred_date: Date
    updated_at: Date
    updated_by: String
  }

  input StudentFilterInput {
    student_status: StudentStatus
    academic_status: AcademicStatus
    gender: StudentGender
    date_of_birth: DateFilter
    school_id: ID
    school_name: String
  }

  extend type Query {
    GetAllStudents(
      filter: StudentFilterInput
      sort: SortInput
      pagination: PaginationInput
    ): StudentPaginationResult!
    GetOneStudent(id: ID!): Student
  }

  extend type Mutation {
    CreateStudent(input: CreateStudentInput!): Student!
    UpdateStudent(id: ID!, input: UpdateStudentInput!): Student!
    DeleteStudent(id: ID!): Student!
  }
`;

// *************** IMPORT LIBRARY ***************

const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************

module.exports = gql`
  enum StudentTestResultStatus {
    GRADED
    PENDING_REVIEW
    NEEDS_CORRECTION
    DELETED
  }

  type Mark {
    notation_text: String!
    mark: Float!
  }

  type StudentTestResult {
    id: ID!
    student_id: ID!
    student: Student
    test_id: ID!
    test: Test
    marks: [Mark!]!
    average_mark: Float!
    mark_entry_date: Date
    mark_validated_date: Date
    graded_by: ID
    graded: User
    remarks: String
    student_test_result_status: StudentTestResultStatus!
    created_at: Date
    created_by: String
    updated_at: Date
    updated_by: String
    deleted_at: Date
    deleted_by: String
  }

  input MarkInput {
    notation_text: String!
    mark: Float!
  }

  input CreateStudentTestResultInput {
    student_id: ID!
    test_id: ID!
    marks: [MarkInput!]
    graded_by: ID
    remarks: String
    student_test_result_status: StudentTestResultStatus
    created_by: String
  }

  input UpdateStudentTestResultInput {
    student_id: ID!
    test_id: ID!
    marks: [MarkInput!]
    graded_by: ID
    remarks: String
    student_test_result_status: StudentTestResultStatus
    created_by: String
  }

  input StudentTestResultFilter {
    student_test_result_status: StudentTestResultStatus
    student_id: ID
    test_id: ID
  }

  type Query {
    GetAllStudentTestResults(
      filter: StudentTestResultFilter
    ): [StudentTestResult!]!
    GetOneStudentTestResult(
      id: ID!
      filter: StudentTestResultFilter
    ): StudentTestResult
  }

  type Mutation {
    CreateStudentTestResult(
      input: CreateStudentTestResultInput!
    ): StudentTestResult!
    UpdateStudentTestResult(
      id: ID!
      input: UpdateStudentTestResultInput!
    ): StudentTestResult!
    DeleteStudentTestResult(id: ID!, deleted_by: String): StudentTestResult!
    EnterMarks(input: CreateStudentTestResultInput!): StudentTestResult!
    ValidateMarks(id: ID!): StudentTestResult!
  }
`;

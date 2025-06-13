// *************** IMPORT LIBRARY ***************

const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************

module.exports = gql`
  scalar Date

  enum StudentTaskResultStatus {
    GRADED
    PENDING_REVIEW
    NEEDS_CORRECTION
    DELETED
  }

  type Mark {
    notation_text: String!
    mark: Float!
  }

  type StudentTaskResult {
    id: ID!
    student_id: ID!
    student: Student
    test_id: ID!
    test: Test
    marks: [Mark!]!
    average_mark: Float!
    mark_entry_date: Date
    graded_by: User
    remarks: String
    student_task_result_status: StudentTaskResultStatus!
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

  input CreateStudentTaskResultInput {
    student_id: ID!
    test_id: ID!
    marks: [MarkInput!]!
    graded_by: ID
    remarks: String
    student_task_result_status: StudentTaskResultStatus
    created_by: String
  }

  input UpdateStudentTaskResultInput {
    marks: [MarkInput!]
    graded_by: ID
    remarks: String
    student_task_result_status: StudentTaskResultStatus
    updated_by: String
  }

  input StudentTaskResultFilter {
    student_task_result_status: StudentTaskResultStatus
    student_id: ID!
    test_id: ID!
  }

  type Query {
    GetAllStudentTaskResults(
      filter: StudentTaskResultFilter
    ): [StudentTaskResult!]!
    GetOneStudentTaskResult(id: ID!): StudentTaskResult
  }

  type Mutation {
    CreateStudentTaskResult(
      input: CreateStudentTaskResultInput!
    ): StudentTaskResult!
    UpdateStudentTaskResult(
      id: ID!
      input: UpdateStudentTaskResultInput!
    ): StudentTaskResult!
    DeleteStudentTaskResult(id: ID!, deleted_by: String!): StudentTaskResult!
  }
`;

// *************** IMPORT LIBRARY ***************

const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************

module.exports = gql`
  scalar ObjectId
  scalar Date

  enum CalculationResultStatus {
    PUBLISHED
    ARCHIVED
    DELETED
  }

  type TestResult {
    test_id: ObjectId!
    test_result: ExpectedOutcome!
    average_mark: Float!
    weighted_mark: Float!
  }

  type SubjectResult {
    subject_id: ObjectId!
    subject_result: ExpectedOutcome!
    total_mark: Float!
    test_results: [TestResult!]!
  }

  type BlockResult {
    block_id: ObjectId!
    block_result: ExpectedOutcome!
    total_mark: Float!
    subject_results: [SubjectResult!]!
  }

  type CalculationResult {
    student_id: ObjectId!
    overall_result: ExpectedOutcome!
    results: [BlockResult!]!
    calculation_result_status: CalculationResultStatus!
    created_at: Date
    created_by: ObjectId
    updated_by: ObjectId
    updated_at: Date
    deleted_by: ObjectId
    deleted_at: Date
  }

  input FilterCalculationResult {
    student_id: ObjectId
    calculation_result_status: CalculationResultStatus
  }

  type Query {
    CalculationResults(filter: FilterCalculationResult): [CalculationResult!]!
  }
`;

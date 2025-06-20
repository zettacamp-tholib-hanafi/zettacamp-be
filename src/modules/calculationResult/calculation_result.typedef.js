// *************** IMPORT LIBRARY ***************

const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************

module.exports = gql`
  scalar ObjectId
  scalar Date

  enum EvaluationResult {
    PASS
    FAIL
  }

  enum BlockRuleType {
    SUBJECT_PASS_STATUS
    TEST_PASS_STATUS
    BLOCK_AVERAGE
  }

  enum SubjectRuleType {
    TEST_SCORE
    AVERAGE
  }

  enum Operator {
    EQ
    GTE
    GT
    LTE
    LT
  }

  enum Logic {
    AND
    OR
  }

  type BlockRule {
    type: BlockRuleType!
    subject_id: ObjectId
    test_id: ObjectId
    operator: Operator!
    value: Float!
  }

  type BlockCriteriaSnapshot {
    logic: Logic!
    rules: [BlockRule!]!
  }

  type SubjectRule {
    type: SubjectRuleType!
    test_id: ObjectId
    operator: Operator!
    value: Float!
  }

  type SubjectCriteriaSnapshot {
    logic: Logic!
    rules: [SubjectRule!]!
  }

  type TestCriteriaSnapshot {
    operator: Operator!
    value: Float!
  }

  type TestResult {
    test_id: ObjectId!
    criteria: TestCriteriaSnapshot!
    test_result: EvaluationResult!
    average_mark: Float!
    weighted_mark: Float!
  }

  type SubjectResult {
    subject_id: ObjectId!
    criteria: SubjectCriteriaSnapshot!
    subject_result: EvaluationResult!
    total_mark: Float!
    test_results: [TestResult!]!
  }

  type BlockResult {
    block_id: ObjectId!
    criteria: BlockCriteriaSnapshot!
    block_result: EvaluationResult!
    total_mark: Float!
    subject_results: [SubjectResult!]!
  }

  type CalculationResult {
    student_id: ObjectId!
    results: [BlockResult!]!
    created_at: Date
    created_by: ObjectId
    updated_by: ObjectId
    updated_at: Date
    deleted_by: ObjectId
    deleted_at: Date
  }

  input FilterCalculationResult {
    student_id: ObjectId
  }

  type Query {
    GetCalculationResults(
      filter: FilterCalculationResult
    ): [CalculationResult!]!
    GetOneCalculationResult(
      id: ObjectId!
      filter: FilterCalculationResult
    ): CalculationResult
  }
`;

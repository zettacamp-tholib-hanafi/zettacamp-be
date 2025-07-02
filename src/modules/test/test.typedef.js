// *************** IMPORT LIBRARY ***************
const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************
module.exports = gql`
  scalar Date

  enum GradingMethod {
    MANUAL
    AUTO_GRADED
  }

  enum TestStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
    DELETED
  }

  type Notation {
    notation_text: String!
    max_points: Float!
  }

  type TestCriteriaRule {
    logical_operator: LogicalOperator
    operator: RuleOperator!
    value: Float!
  }

  type TestCriteria {
    expected_outcome: ExpectedOutcome!
    rules: [TestCriteriaRule!]!
  }

  type Test {
    id: ID!
    name: String!
    subject_id: ID!
    subject: Subject
    description: String
    weight: Float!
    notations: [Notation!]!
    total_score: Float
    grading_method: GradingMethod
    criteria: [TestCriteria!]
    test_status: TestStatus!
    attachments: [String]
    published_date: Date
    created_at: Date
    created_by: String
    updated_at: Date
    updated_by: String
    deleted_at: Date
    deleted_by: String
  }

  input NotationInput {
    notation_text: String!
    max_points: Float!
  }

  input TestCriteriaRuleInput {
    logical_operator: LogicalOperator
    operator: RuleOperator!
    value: Float!
  }

  input TestCriteriaInput {
    expected_outcome: ExpectedOutcome!
    rules: [TestCriteriaRuleInput!]!
  }

  input CreateTestInput {
    name: String!
    subject_id: ID!
    description: String
    weight: Float!
    notations: [NotationInput!]!
    grading_method: GradingMethod
    criteria: [TestCriteriaInput!]
    test_status: TestStatus!
    attachments: [String]
    published_date: Date
  }

  input UpdateTestInput {
    name: String!
    subject_id: ID!
    description: String
    weight: Float!
    notations: [NotationInput!]!
    grading_method: GradingMethod
    criteria: [TestCriteriaInput!]
    test_status: TestStatus!
    attachments: [String]
    published_date: Date
  }

  input PublishTestInput {
    user_id: ID!
    due_date: Date
  }

  input TestFilter {
    grading_method: GradingMethod
    test_status: TestStatus
  }

  type Query {
    GetAllTests(filter: TestFilter): [Test!]!
    GetOneTest(id: ID!, filter: TestFilter): Test
  }

  type Mutation {
    CreateTest(input: CreateTestInput!): Test!
    UpdateTest(id: ID!, input: UpdateTestInput!): Test!
    DeleteTest(id: ID!, deleted_by: String): Test!
    PublishTest(id: ID!, input: PublishTestInput!): Test!
  }
`;

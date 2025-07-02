// *************** IMPORT LIBRARY ***************
const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************
module.exports = gql`
  enum SubjectLevel {
    ELEMENTARY
    MIDDLE
    HIGH
  }

  enum SubjectCategory {
    CORE
    ELECTIVE
    SUPPORT
  }

  enum SubjectStatus {
    ACTIVE
    ARCHIVED
    DELETED
  }

  enum PassingRuleType {
    TEST_SCORE
    AVERAGE
  }

  type Subject {
    id: ID!
    name: String!
    subject_code: String!
    description: String
    level: SubjectLevel!
    category: SubjectCategory
    block_id: ID!
    coefficient: Float!
    tests: [Test]
    criteria: [SubjectPassingCriteriaGroup!]
    subject_status: SubjectStatus!
    created_at: Date!
    created_by: String
    updated_at: Date
    updated_by: String
    deleted_at: Date
    deleted_by: String
  }

  type SubjectPassingCriteriaGroup {
    expected_outcome: ExpectedOutcome!
    rules: [SubjectPassingRule!]!
  }

  type SubjectPassingRule {
    logical_operator: LogicalOperator
    type: PassingRuleType!
    operator: RuleOperator!
    value: Float!
    test_id: ID
  }

  input CreateSubjectInput {
    name: String!
    subject_code: String!
    description: String
    level: SubjectLevel!
    category: SubjectCategory
    block_id: ID!
    tests: [ID]
    coefficient: Float!
    criteria: [SubjectPassingCriteriaGroupInput!]
    subject_status: SubjectStatus!
    created_by: String
  }

  input UpdateSubjectInput {
    name: String!
    subject_code: String!
    description: String
    level: SubjectLevel!
    category: SubjectCategory
    block_id: ID!
    tests: [ID]
    coefficient: Float!
    criteria: [SubjectPassingCriteriaGroupInput!]
    subject_status: SubjectStatus!
    updated_by: String
  }

  input SubjectPassingCriteriaGroupInput {
    expected_outcome: ExpectedOutcome!
    rules: [SubjectPassingRuleInput!]!
  }

  input SubjectPassingRuleInput {
    logical_operator: LogicalOperator
    type: PassingRuleType!
    operator: RuleOperator!
    value: Float!
    test_id: ID
  }

  input SubjectFilter {
    level: SubjectLevel
    category: SubjectCategory
    subject_status: SubjectStatus
    block_id: ID
  }

  extend type Query {
    GetAllSubjects(filter: SubjectFilter): [Subject!]!
    GetOneSubject(id: ID!, filter: SubjectFilter): Subject
  }

  extend type Mutation {
    CreateSubject(input: CreateSubjectInput!): Subject!
    UpdateSubject(id: ID!, input: UpdateSubjectInput!): Subject!
    DeleteSubject(id: ID!, deleted_by: String): Subject!
  }
`;

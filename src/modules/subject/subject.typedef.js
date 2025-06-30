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

  enum SubjectLogicalOperator {
    AND
    OR
  }

  enum PassingRuleType {
    TEST_SCORE
    AVERAGE
  }

  enum PassingRuleOperator {
    EQ
    GTE
    GT
    LTE
    LT
  }

  enum SubjectExpectedOutcome {
    PASS
    FAIL
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
    criteria: [SubjectPassingCriteria!]!
    subject_status: SubjectStatus!
    created_at: Date!
    created_by: String
    updated_at: Date
    updated_by: String
    deleted_at: Date
    deleted_by: String
  }

  type SubjectPassingCriteria {
    logical_operator: SubjectLogicalOperator
    type: PassingRuleType!
    operator: PassingRuleOperator!
    value: Float!
    test_id: ID
    expected_outcome: SubjectExpectedOutcome!
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
    criteria: [SubjectPassingCriteriaInput!]
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
    criteria: [SubjectPassingCriteriaInput!]
    subject_status: SubjectStatus!
    updated_by: String
  }

  input SubjectPassingCriteriaInput {
    logical_operator: SubjectLogicalOperator
    type: PassingRuleType!
    operator: PassingRuleOperator!
    value: Float!
    test_id: ID
    expected_outcome: SubjectExpectedOutcome!
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

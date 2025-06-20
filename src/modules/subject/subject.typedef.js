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

  enum PassingCriteriaOperator {
    AND
    OR
  }

  enum ConditionType {
    SINGLE_TEST
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
    passing_criteria: SubjectPassingCriteria!
    subject_status: SubjectStatus!
    created_at: Date!
    created_by: String
    updated_at: Date
    updated_by: String
    deleted_at: Date
    deleted_by: String
  }

  type SubjectPassingCriteria {
    operator: PassingCriteriaOperator
    conditions: [SubjectPassingCondition!]!
  }

  type SubjectPassingCondition {
    condition_type: ConditionType!
    min_score: Float!
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
    passing_criteria: SubjectPassingCriteriaInput!
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
    passing_criteria: SubjectPassingCriteriaInput!
    subject_status: SubjectStatus!
    updated_by: String
  }

  input SubjectPassingCriteriaInput {
    operator: PassingCriteriaOperator!
    conditions: [SubjectPassingConditionInput!]!
  }

  input SubjectPassingConditionInput {
    condition_type: ConditionType!
    min_score: Float!
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

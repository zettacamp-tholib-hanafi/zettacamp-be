// *************** IMPORT LIBRARY ***************
const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************

module.exports = gql`
  scalar Date

  enum BlockStatus {
    ACTIVE
    ARCHIVED
    DELETED
  }

  enum BlockPassingCriteriaOperator {
    AND
    OR
  }

  enum BlockRuleType {
    SUBJECT_PASS_STATUS
    TEST_PASS_STATUS
    BLOCK_AVERAGE
  }

  enum Operator {
    EQ
    GTE
    GT
    LTE
    LT
  }

  input PassingRuleInput {
    type: BlockRuleType!
    subject_id: ID
    test_id: ID
    operator: Operator!
    value: Float!
  }

  input BlockPassingCriteriaInput {
    logic: BlockPassingCriteriaOperator!
    rules: [PassingRuleInput!]!
  }

  type PassingRule {
    type: BlockRuleType!
    subject_id: ID
    test_id: ID
    operator: Operator!
    value: Float!
  }

  type BlockPassingCriteria {
    logic: BlockPassingCriteriaOperator!
    rules: [PassingRule!]!
  }

  type Block {
    id: ID!
    name: String!
    description: String
    block_status: BlockStatus!
    passing_criteria: BlockPassingCriteria
    start_date: Date!
    end_date: Date
    subjects: [Subject!]
    created_at: Date!
    created_by: String
    updated_at: Date
    updated_by: String
    deleted_at: Date
    deleted_by: String
  }

  input CreateBlockInput {
    name: String!
    description: String
    block_status: BlockStatus!
    passing_criteria: BlockPassingCriteriaInput!
    start_date: Date!
    end_date: Date
    subjects: [ID!]
  }

  input UpdateBlockInput {
    name: String!
    description: String
    block_status: BlockStatus!
    passing_criteria: BlockPassingCriteriaInput!
    start_date: Date!
    end_date: Date
    subjects: [ID!]
  }

  input BlockFilter {
    block_status: BlockStatus!
  }

  extend type Query {
    GetAllBlocks(filter: BlockFilter): [Block!]!
    GetOneBlock(id: ID!, filter: BlockFilter): Block
  }

  extend type Mutation {
    CreateBlock(input: CreateBlockInput!): Block!
    UpdateBlock(id: ID!, input: UpdateBlockInput!): Block!
    DeleteBlock(id: ID!, deleted_by: String): Block!
  }
`;

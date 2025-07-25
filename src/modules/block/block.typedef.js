// *************** IMPORT LIBRARY ***************
const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************

module.exports = gql`
  enum BlockStatus {
    ACTIVE
    ARCHIVED
    DELETED
  }

  enum BlockRuleType {
    SUBJECT_PASS_STATUS
    TEST_PASS_STATUS
    BLOCK_AVERAGE
  }

  input BlockRuleInput {
    logical_operator: LogicalOperator
    type: BlockRuleType!
    subject_id: ID
    test_id: ID
    operator: RuleOperator!
    value: Float!
  }

  input BlockCriteriaGroupInput {
    expected_outcome: ExpectedOutcome!
    rules: [BlockRuleInput!]!
  }

  type BlockRule {
    logical_operator: LogicalOperator
    type: BlockRuleType!
    subject_id: ID
    test_id: ID
    operator: RuleOperator!
    value: Float!
  }

  type BlockCriteriaGroup {
    expected_outcome: ExpectedOutcome!
    rules: [BlockRule!]!
  }

  type Block {
    id: ID!
    name: String!
    description: String
    block_status: BlockStatus!
    criteria: [BlockCriteriaGroup!]
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
    criteria: [BlockCriteriaGroupInput!]
    start_date: Date!
    end_date: Date
    subjects: [ID!]
  }

  input UpdateBlockInput {
    name: String!
    description: String
    block_status: BlockStatus!
    criteria: [BlockCriteriaGroupInput!]
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

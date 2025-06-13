// *************** IMPORT LIBRARY ***************
const gql = require("graphql-tag");

module.exports = gql`
  scalar Date

  enum BlockStatus {
    ACTIVE
    ARCHIVED
    DELETED
  }

  type Block {
    id: ID!
    name: String!
    description: String
    block_status: BlockStatus!
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

  # *************** INPUT TYPES ***************
  input CreateBlockInput {
    name: String!
    description: String
    block_status: BlockStatus!
    start_date: Date!
    end_date: Date
    subjects: [ID!]
  }

  input UpdateBlockInput {
    name: String!
    description: String
    block_status: BlockStatus!
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
// *************** IMPORT LIBRARY ***************
const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************

module.exports = gql`
  scalar Date

  enum LogicalOperator {
    AND
    OR
  }

  enum RuleOperator {
    EQ
    GTE
    GT
    LTE
    LT
  }

  enum ExpectedOutcome {
    PASS
    FAIL
  }

  enum OrderSort {
    ASC
    DESC
  }

  input DateFilter {
    eq: Date
    gte: Date
    lte: Date
    gt: Date
    lt: Date
  }

  input PaginationInput {
    page: Int = 1
    limit: Int
  }

  input SortInput {
    field: String
    order: OrderSort
  }

  type PaginationResult {
    total: Int!
    total_pages: Int!
    current_page: Int!
    per_page: Int!
  }
`;

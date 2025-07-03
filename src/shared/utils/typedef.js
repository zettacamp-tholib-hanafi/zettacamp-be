// *************** IMPORT LIBRARY ***************
const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************

module.exports = gql`
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
`;

// *************** IMPORT LIBRARY ***************
const express = require("express");
const cors = require("cors");
const { expressMiddleware } = require("@apollo/server/express4");

// *************** IMPORT CORE ***************
const { PORT } = require("./config");

// *************** IMPORT MODULE ***************
const { apollo, contextApollo } = require("./apollo");
const {
  HandleTranscriptRequest,
} = require("../modules/calculationResult/calculation_result.controller");

async function ExpressRun() {
  const app = express();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(apollo, contextApollo)
  );

  app.get("/transcript/:student_id", HandleTranscriptRequest);

  app.listen(PORT, () => {
    console.log(`GraphQL Playground ready at http://localhost:${PORT}/graphql`);
  });
}

// *************** EXPORT MODULE ***************

module.exports = {
  ExpressRun,
};

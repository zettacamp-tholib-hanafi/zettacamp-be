// *************** IMPORT LIBRARY ***************
const express = require("express");
const cors = require("cors");
const { expressMiddleware } = require("@apollo/server/express4");

// *************** IMPORT CORE ***************
const { PORT } = require("./config");

// *************** IMPORT MODULE ***************
const { apollo, contextApollo } = require("./apollo");

async function ExpressRun() {
  const app = express();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(apollo, contextApollo)
  );

  app.listen(PORT, () => {
    console.log(`GraphQL Playground ready at http://localhost:${PORT}/graphql`);
  });
}
module.exports = {
  ExpressRun,
};

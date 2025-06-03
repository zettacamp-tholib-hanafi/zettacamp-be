// *************** IMPORT LIBRARY ***************
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const path = require('path');
const { loadFilesSync } = require('@graphql-tools/load-files');
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');

// *************** IMPORT MODUL ***************
// Configuration modul db
const connectDB = require('./config/db');

// Model MongoDB
require('./models/User');
require('./models/Student');
require('./models/School');

// *************** MUTATION ***************
// Connect to MongoDB
connectDB();

// Load GraphQL schema
const typeDefs = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, 'graphql/**/*.graphql')),
);


// Configure Apollo Server
const apollo = new ApolloServer({
  typeDefs,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

// Start Express and Apollo
async function start() {
  await apollo.start();

  const app = express();
  const PORT = process.env.PORT || 4000;

  // Define GraphQL endpoint
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(apollo, {
      context: async () => ({}),
    }),
  );

  app.listen(PORT, () => {
    console.log(`🚀  GraphQL ready at http://localhost:${PORT}/graphql`);
  });
}

// Call Apollo Server
start();

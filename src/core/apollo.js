// *************** IMPORT LIBRARY ***************
const {
  ApolloServerPluginLandingPageLocalDefault,
} = require("@apollo/server/plugin/landingPage/default");
const { ApolloServer } = require("@apollo/server");

// *************** IMPORT CORE ***************
const { FormatError } = require("./error");
const { typeDefs } = require("./typedef");
const { resolvers } = require("./resolver");
const { Loaders } = require("./loader");

// *************** IMPORT MODULE ***************

const apollo = new ApolloServer({
  typeDefs,
  resolvers,
  FormatError,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

const contextApollo = {
  context: async () => ({
    loaders: Loaders,
  }),
};

// *************** EXPORT MODULE ***************
module.exports = {
  apollo,
  contextApollo,
};

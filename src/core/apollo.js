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
const AuthRequestMiddleware = require("../middlewares/auth/auth_request_middleware");

const apollo = new ApolloServer({
  typeDefs,
  resolvers,
  FormatError,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

const contextApollo = {
  context: async ({ req }) => {
    let user = null;

    try {
      const authResult = await AuthRequestMiddleware({request: req});
      user = authResult?.user || null;
    } catch {
      user = null;
    }

    return {
      user,
      loaders: Loaders,
    };
  },
};

// *************** EXPORT MODULE ***************
module.exports = {
  apollo,
  contextApollo,
};

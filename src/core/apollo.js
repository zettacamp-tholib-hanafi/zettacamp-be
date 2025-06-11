// *************** IMPORT LIBRARY ***************
const {
  ApolloServerPluginLandingPageLocalDefault,
} = require("@apollo/server/plugin/landingPage/default");
const { ApolloServer } = require("@apollo/server");
const path = require("path");
const { mergeResolvers, mergeTypeDefs } = require("@graphql-tools/merge");
const { loadFilesSync } = require("@graphql-tools/load-files");

// *************** IMPORT CORE ***************
const { FormatError } = require("./error");

// *************** IMPORT MODULE ***************
const { SchoolLoader } = require("../modules/school/school.loader");
const { StudentLoader } = require("../modules/student/student.loader");

const typeDefs = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, "../modules/**/*.typedef.js"))
);
const resolvers = mergeResolvers(
  loadFilesSync(path.join(__dirname, "../modules/**/*.resolver.js"))
);

const apollo = new ApolloServer({
  typeDefs,
  resolvers,
  FormatError,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

const contextApollo = {
  context: async () => ({
    loaders: {
      student: StudentLoader(),
      school: SchoolLoader(),
    },
  }),
};

// *************** EXPORT MODULE ***************
module.exports = {
  apollo,
  contextApollo,
};

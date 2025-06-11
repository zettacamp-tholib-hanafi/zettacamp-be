// *************** IMPORT LIBRARY ***************
const {
  ApolloServerPluginLandingPageLocalDefault,
} = require("@apollo/server/plugin/landingPage/default");
const { ApolloServer } = require("@apollo/server");

// *************** IMPORT CORE ***************
const { FormatError } = require("./error");

// *************** IMPORT MODULE ***************
const { SchoolLoader } = require("../modules/school/school.loader");
const { StudentLoader } = require("../modules/student/student.loader");

const userTypeDefs = require("../modules/user/user.typedef");
const studentTypeDefs = require("../modules/student/student.typedef");
const schoolTypeDefs = require("../modules/school/school.typedef");

const userResolvers = require("../modules/user/user.resolver");
const studentResolvers = require("../modules/student/student.resolver");
const schoolResolvers = require("../modules/school/school.resolver");

const typeDefs = [userTypeDefs, studentTypeDefs, schoolTypeDefs];

const resolvers = [userResolvers, studentResolvers, schoolResolvers];

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

// *************** IMPORT MODUL ***************

const userResolvers = require("../modules/user/user.resolver");
const studentResolvers = require("../modules/student/student.resolver");
const schoolResolvers = require("../modules/school/school.resolver");

const resolvers = [userResolvers, studentResolvers, schoolResolvers];

// *************** EXPORT MODUL ***************

module.exports = {
  resolvers,
};

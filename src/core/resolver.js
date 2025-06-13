// *************** IMPORT MODUL ***************

const userResolvers = require("../modules/user/user.resolver");
const studentResolvers = require("../modules/student/student.resolver");
const schoolResolvers = require("../modules/school/school.resolver");
const blockResolver = require("../modules/block/block.resolver");
const subjectResolver = require("../modules/subject/subject.resolver");

const resolvers = [userResolvers, studentResolvers, schoolResolvers, blockResolver, subjectResolver];

// *************** EXPORT MODUL ***************

module.exports = {
  resolvers,
};

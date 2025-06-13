// *************** IMPORT MODUL ***************

const userResolvers = require("../modules/user/user.resolver");
const studentResolvers = require("../modules/student/student.resolver");
const schoolResolvers = require("../modules/school/school.resolver");
const blockResolver = require("../modules/block/block.resolver");
const subjectResolver = require("../modules/subject/subject.resolver");
const testResolver = require("../modules/test/test.resolver");
const studentTaskResultResolver = require("../modules/studentTaskResult/studentTaskResult.resolver");

const resolvers = [
  userResolvers,
  studentResolvers,
  schoolResolvers,
  blockResolver,
  subjectResolver,
  testResolver,
  studentTaskResultResolver
];

// *************** EXPORT MODUL ***************

module.exports = {
  resolvers,
};

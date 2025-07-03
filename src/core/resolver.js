// *************** IMPORT MODUL ***************

const userResolvers = require("../modules/user/user.resolver");
const studentResolvers = require("../modules/student/student.resolver");
const schoolResolvers = require("../modules/school/school.resolver");
const blockResolver = require("../modules/block/block.resolver");
const subjectResolver = require("../modules/subject/subject.resolver");
const testResolver = require("../modules/test/test.resolver");
const studentTestResultResolver = require("../modules/studentTestResult/student_test_result.resolver");
const taskResolver = require("../modules/task/task.resolver");
const calculationResultResolver = require("../modules/calculationResult/calculation_result.resolver");

const resolvers = [
  userResolvers,
  studentResolvers,
  schoolResolvers,
  blockResolver,
  subjectResolver,
  testResolver,
  studentTestResultResolver,
  taskResolver,
  calculationResultResolver,
];

// *************** EXPORT MODUL ***************

module.exports = {
  resolvers,
};

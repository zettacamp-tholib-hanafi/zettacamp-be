// *************** IMPORT MODUL ***************

const globalTypeDefs = require("../shared/utils/typedef");
const userTypeDefs = require("../modules/user/user.typedef");
const studentTypeDefs = require("../modules/student/student.typedef");
const schoolTypeDefs = require("../modules/school/school.typedef");
const blockTypeDefs = require("../modules/block/block.typedef");
const subjectTypedef = require("../modules/subject/subject.typedef");
const testTypedef = require("../modules/test/test.typedef");
const studentTestResultTypedef = require("../modules/studentTestResult/student_test_result.typedef");
const taskTypedef = require("../modules/task/task.typedef");
const calculationResultTypedef = require("../modules/calculationResult/calculation_result.typedef");

const typeDefs = [
  globalTypeDefs,
  userTypeDefs,
  studentTypeDefs,
  schoolTypeDefs,
  blockTypeDefs,
  subjectTypedef,
  testTypedef,
  studentTestResultTypedef,
  taskTypedef,
  calculationResultTypedef,
];

// *************** EXPORT MODUL ***************

module.exports = {
  typeDefs,
};

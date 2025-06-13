// *************** IMPORT MODUL ***************

const userTypeDefs = require("../modules/user/user.typedef");
const studentTypeDefs = require("../modules/student/student.typedef");
const schoolTypeDefs = require("../modules/school/school.typedef");
const blockTypeDefs = require("../modules/block/block.typedef");
const subjectTypedef = require("../modules/subject/subject.typedef");
const testTypedef = require("../modules/test/test.typedef");

const typeDefs = [
  userTypeDefs,
  studentTypeDefs,
  schoolTypeDefs,
  blockTypeDefs,
  subjectTypedef,
  testTypedef
];

// *************** EXPORT MODUL ***************

module.exports = {
  typeDefs,
};

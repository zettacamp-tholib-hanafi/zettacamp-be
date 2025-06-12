// *************** IMPORT MODUL ***************

const userTypeDefs = require("../modules/user/user.typedef");
const studentTypeDefs = require("../modules/student/student.typedef");
const schoolTypeDefs = require("../modules/school/school.typedef");

const typeDefs = [userTypeDefs, studentTypeDefs, schoolTypeDefs];

// *************** EXPORT MODUL ***************

module.exports = {
  typeDefs,
};

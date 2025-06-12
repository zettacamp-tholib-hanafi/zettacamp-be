// *************** IMPORT MODUL ***************

const { SchoolLoader } = require("../modules/school/school.loader");
const { StudentLoader } = require("../modules/student/student.loader");

const Loaders = {
  student: StudentLoader(),
  school: SchoolLoader(),
};

// *************** EXPORT MODUL ***************
module.exports = {
  Loaders,
};

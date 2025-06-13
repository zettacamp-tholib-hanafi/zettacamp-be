// *************** IMPORT MODUL ***************

const { BlockLoader } = require("../modules/block/block.loader");
const { SchoolLoader } = require("../modules/school/school.loader");
const { StudentLoader } = require("../modules/student/student.loader");

const Loaders = {
  student: StudentLoader(),
  school: SchoolLoader(),
  block: BlockLoader(),
};

// *************** EXPORT MODUL ***************
module.exports = {
  Loaders,
};

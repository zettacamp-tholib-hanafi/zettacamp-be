// *************** IMPORT MODUL ***************

const { BlockLoader } = require("../modules/block/block.loader");
const { SchoolLoader } = require("../modules/school/school.loader");
const { StudentLoader } = require("../modules/student/student.loader");
const { SubjectLoader } = require("../modules/subject/subject.loader");
const { TestLoader } = require("../modules/test/test.loader");
const {
  StudentTestResultLoader,
} = require("../modules/studentTestResult/student_test_result.loader");
const { UserLoader } = require("../modules/user/user.loader");
const { TaskLoader } = require("../modules/task/task.loader");

const Loaders = {
  user: UserLoader(),
  student: StudentLoader(),
  school: SchoolLoader(),
  block: BlockLoader(),
  subject: SubjectLoader(),
  test: TestLoader(),
  studentTestResult: StudentTestResultLoader(),
  task: TaskLoader(),
};

// *************** EXPORT MODUL ***************
module.exports = {
  Loaders,
};

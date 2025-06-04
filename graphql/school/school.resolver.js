// *************** IMPORT MODEL ***************
const School = require("./school.model.js");

// *************** QUERY ***************

// *************** Get all schools (excluding soft-deleted)
const GetAllSchools = async () => {
  return await School.find({ deleted_at: null });
};

// *************** Get a specific school by ID (if not deleted)
const GetOneSchool = async (_, { id }) => {
  return await School.findOne({ _id: id, deleted_at: null });
};

// *************** MUTATION ***************

// *************** Create new School
const CreateSchool = async (_, { input }) => {
  const school = new School(input);
  return await school.save();
};

// *************** Update existing school by ID
const UpdateSchool = async (_, { id, input }) => {
  return await School.findOneAndUpdate(
    { _id: id },
    { $set: input },
    { new: true }
  );
};

// *************** Soft delete a school by ID
const DeleteSchool = async (_, { id }) => {
  return await School.findOneAndUpdate(
    { _id: id },
    { $set: { deleted_at: new Date() } },
    { new: true }
  );
};

// *************** RESOLVER ***************

// *************** Get all students in this school
const students = (school, _, context) => {
  if (!context?.loaders?.student) {
    throw new Error("Student loader not initialized");
  }
  return context.loaders.student.load(school._id);
};

// *************** EXPORT ***************
module.exports = {
  Query: {
    GetAllSchools,
    GetOneSchool,
  },
  Mutation: {
    CreateSchool,
    UpdateSchool,
    DeleteSchool,
  },
  School: {
    students,
  },
};

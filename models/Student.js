const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName:   { type: String, required: true },
  lastName:    { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  dateOfBirth: { type: Date },
  schoolId:    { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  deletedAt:   { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);

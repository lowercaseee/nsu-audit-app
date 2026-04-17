const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true },
  credits: { type: Number, required: true },
  grade: { type: String, required: true },
  semester: { type: String, required: true }
}, { _id: false });

const missingCoursesSchema = new mongoose.Schema({
  mandatoryGed: [String],
  coreMath: [String],
  coreBusiness: [String],
  majorCore: [String]
}, { _id: false });

const auditResultSchema = new mongoose.Schema({
  level1: {
    totalCredits: Number,
    validCourses: Number,
    failedCourses: Number,
    withdrawnCourses: Number
  },
  level2: {
    cgpa: Number,
    creditsAttempted: Number,
    gradePoints: Number
  },
  level3: {
    onProbation: Boolean,
    creditDeficit: Number,
    missingCourses: missingCoursesSchema,
    eligible: Boolean
  }
}, { _id: false });

const auditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  studentId: {
    type: String,
    trim: true
  },
  studentName: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: String,
    trim: true
  },
  enrollmentYear: {
    type: Number
  },
  graduationYear: {
    type: Number
  },
  program: {
    type: String,
    required: true
  },
  courses: [courseSchema],
  waivedCourses: [String],
  pdfs: {
    transcript: String,
    certificate: String
  },
  result: {
    level1: {
      totalCredits: Number,
      validCourses: Number,
      failedCourses: Number,
      withdrawnCourses: Number
    },
    level2: {
      cgpa: Number,
      creditsAttempted: Number,
      gradePoints: Number
    },
    level3: {
      onProbation: Boolean,
      creditDeficit: Number,
      missingCourses: {
        mandatoryGed: [String],
        coreMath: [String],
        coreBusiness: [String],
        majorCore: [String]
      },
      eligible: Boolean
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Audit', auditSchema);

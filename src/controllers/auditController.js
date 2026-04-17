const Audit = require('../models/Audit');
const Program = require('../models/Program');
const AuditService = require('../services/auditService');
const pdfService = require('../services/pdfService');

const successResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    status: 'success',
    ...data
  });
};

const errorResponse = (res, message, statusCode, errors = null) => {
  const response = { status: 'error', message };
  if (errors) response.errors = errors;
  res.status(statusCode).json(response);
};

const runAudit = async (req, res) => {
  try {
    const { 
      studentId, 
      studentName,
      dateOfBirth,
      enrollmentYear,
      graduationYear,
      program: programName, 
      courses, 
      waivedCourses = [] 
    } = req.body;
    
    if (!programName) {
      return errorResponse(res, 'Program name is required', 400);
    }
    
    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return errorResponse(res, 'At least one course is required', 400);
    }
    
    const invalidCourses = courses.filter(c => !c.code || !c.grade || !c.semester);
    if (invalidCourses.length > 0) {
      return errorResponse(res, 'Invalid course data', 400, 
        invalidCourses.map((c, i) => `Course ${i + 1}: missing required fields`)
      );
    }
    
    const programDoc = await Program.findOne({ name: programName });
    if (!programDoc) {
      return errorResponse(res, `Program '${programName}' not found. Please check available programs.`, 404);
    }
    
    const result = AuditService.auditRequirements(courses, programDoc, waivedCourses);
    
    const audit = new Audit({
      userId: req.userId,
      studentId,
      studentName,
      dateOfBirth,
      enrollmentYear,
      graduationYear,
      program: programName,
      courses,
      waivedCourses,
      result,
      pdfs: {}
    });
    
    await audit.save();
    
    successResponse(res, {
      data: {
        id: audit._id,
        studentId: audit.studentId,
        studentName: audit.studentName,
        program: audit.program,
        result: audit.result,
        createdAt: audit.createdAt
      }
    }, 201);
  } catch (error) {
    console.error('Create audit error:', error);
    return errorResponse(res, 'Failed to create audit', 500);
  }
};

const getAudit = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);
    
    if (!audit) {
      return errorResponse(res, 'Audit not found', 404);
    }
    
    if (audit.userId && audit.userId.toString() !== req.userId) {
      return errorResponse(res, 'You do not have permission to view this audit', 403);
    }
    
    successResponse(res, { data: audit });
  } catch (error) {
    console.error('Get audit error:', error);
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid audit ID format', 400);
    }
    return errorResponse(res, 'Failed to retrieve audit', 500);
  }
};

const getPrograms = async (req, res) => {
  try {
    const programs = await Program.find().select('name degree totalCredits');
    successResponse(res, { data: programs });
  } catch (error) {
    console.error('Get programs error:', error);
    return errorResponse(res, 'Failed to retrieve programs', 500);
  }
};

const getUserAudits = async (req, res) => {
  try {
    const audits = await Audit.find({ userId: req.userId })
      .select('studentId studentName program result createdAt')
      .sort({ createdAt: -1 });
    successResponse(res, { data: audits });
  } catch (error) {
    console.error('Get user audits error:', error);
    return errorResponse(res, 'Failed to retrieve audit history', 500);
  }
};

const generateAuditPdf = async (req, res) => {
  try {
    const { type } = req.query;
    const auditId = req.params.id;
    
    if (!type || !['transcript', 'certificate'].includes(type)) {
      return errorResponse(res, 'Invalid PDF type. Use "transcript" or "certificate".', 400);
    }
    
    const audit = await Audit.findById(auditId);
    
    if (!audit) {
      return errorResponse(res, 'Audit not found', 404);
    }
    
    if (audit.userId && audit.userId.toString() !== req.userId) {
      return errorResponse(res, 'You do not have permission to download this PDF', 403);
    }
    
    const programDoc = await Program.findOne({ name: audit.program });
    const degree = programDoc ? programDoc.degree : 'Bachelor';
    
    let pdfBuffer;
    let filename;
    
    if (type === 'transcript') {
      const semesters = organizeCoursesBySemester(audit.courses);
      
      const transcriptData = {
        name: audit.studentName || 'N/A',
        id: audit.studentId || 'N/A',
        major: audit.program,
        minor: '-',
        dob: audit.dateOfBirth || 'N/A',
        enrollment_year: audit.enrollmentYear || 'N/A',
        graduation_year: audit.graduationYear || 'N/A',
        degree: degree,
        gpa: audit.result.level2.cgpa,
        total_credits_earned: audit.result.level1.totalCredits,
        total_credits_required: programDoc ? programDoc.totalCredits : 130,
        semesters: semesters,
        date: new Date().toLocaleDateString('en-GB'),
        document_id: `NSU-TR-${audit._id}`
      };
      
      pdfBuffer = await pdfService.generateTranscript(transcriptData);
      filename = `transcript-${audit.studentId || audit._id}.pdf`;
    } else {
      if (!audit.result.level3.eligible) {
        return errorResponse(res, 'Student is not eligible for certificate. Must meet all graduation requirements.', 400);
      }
      
      const certificateData = {
        name: audit.studentName || 'N/A',
        id: audit.studentId || 'N/A',
        program: audit.program,
        degree: degree,
        credits_earned: audit.result.level1.totalCredits,
        gpa: audit.result.level2.cgpa,
        completion_date: new Date().toLocaleDateString('en-GB'),
        certificate_id: `NSU-CERT-${audit._id}`,
        verification_code: audit._id.toString().substring(0, 8).toUpperCase()
      };
      
      pdfBuffer = await pdfService.generateCertificate(certificateData);
      filename = `certificate-${audit.studentId || audit._id}.pdf`;
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate PDF error:', error);
    return errorResponse(res, 'Failed to generate PDF. Please try again.', 500);
  }
};

const organizeCoursesBySemester = (courses) => {
  const semesterMap = {};
  
  for (const course of courses) {
    const semester = course.semester || 'Unknown';
    if (!semesterMap[semester]) {
      semesterMap[semester] = [];
    }
    semesterMap[semester].push(course);
  }
  
  const sortedSemesters = Object.keys(semesterMap).sort();
  return sortedSemesters.map(semester => ({
    semester,
    courses: semesterMap[semester]
  }));
};

module.exports = {
  runAudit,
  getAudit,
  getPrograms,
  getUserAudits,
  generateAuditPdf
};

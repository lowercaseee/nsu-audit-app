const pdfService = require('../services/pdfService');

const errorResponse = (res, message, statusCode) => {
  res.status(statusCode).json({
    status: 'error',
    message
  });
};

const generateTranscript = async (req, res) => {
  try {
    const { name, id, semesters } = req.body;
    
    if (!name || !id || !semesters || !Array.isArray(semesters)) {
      return errorResponse(res, 'Missing required fields: name, id, semesters', 400);
    }
    
    const data = req.body;
    const buffer = await pdfService.generateTranscript(data);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=transcript-${id}.pdf`);
    res.send(buffer);
  } catch (error) {
    console.error('Generate transcript error:', error);
    return errorResponse(res, 'Failed to generate transcript PDF', 500);
  }
};

const generateCertificate = async (req, res) => {
  try {
    const { name, id, program } = req.body;
    
    if (!name || !id || !program) {
      return errorResponse(res, 'Missing required fields: name, id, program', 400);
    }
    
    const data = req.body;
    const buffer = await pdfService.generateCertificate(data);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${id}.pdf`);
    res.send(buffer);
  } catch (error) {
    console.error('Generate certificate error:', error);
    return errorResponse(res, 'Failed to generate certificate PDF', 500);
  }
};

// Direct PDF generation from student data (for test students)
const generateDirectTranscript = async (req, res) => {
  try {
    const { studentData } = req.body;
    
    if (!studentData) {
      return errorResponse(res, 'Student data is required', 400);
    }
    
    const { studentId, studentName, program, courses, cgpa } = studentData;
    
    // Group courses by semester
    const semesterMap = {};
    for (const course of courses) {
      const sem = course.semester || 'Unknown';
      if (!semesterMap[sem]) {
        semesterMap[sem] = [];
      }
      semesterMap[sem].push(course);
    }
    
    const semesters = Object.keys(semesterMap).sort().map(sem => ({
      name: sem,
      courses: semesterMap[sem]
    }));
    
    const data = {
      name: studentName,
      id: studentId,
      program: program,
      cgpa: cgpa,
      semesters
    };
    
    const buffer = await pdfService.generateTranscript(data);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=transcript-${studentId}.pdf`);
    res.send(buffer);
  } catch (error) {
    console.error('Generate direct transcript error:', error);
    return errorResponse(res, 'Failed to generate transcript PDF', 500);
  }
};

const generateDirectCertificate = async (req, res) => {
  try {
    const { studentData } = req.body;
    
    if (!studentData) {
      return errorResponse(res, 'Student data is required', 400);
    }
    
    const { studentId, studentName, program, cgpa, totalCredits } = studentData;
    
    const data = {
      name: studentName,
      id: studentId,
      program: program,
      cgpa: cgpa,
      credits: totalCredits,
      date: new Date().toLocaleDateString('en-GB')
    };
    
    const buffer = await pdfService.generateCertificate(data);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${studentId}.pdf`);
    res.send(buffer);
  } catch (error) {
    console.error('Generate direct certificate error:', error);
    return errorResponse(res, 'Failed to generate certificate PDF', 500);
  }
};

module.exports = {
  generateTranscript,
  generateCertificate,
  generateDirectTranscript,
  generateDirectCertificate
};

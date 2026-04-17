const GRADE_POINTS = { 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'D': 1.0, 'F': 0.0 };
const NON_EARNING = ['F', 'W', 'I', 'Z'];

const MOCK_PROGRAM = { totalCredits: 120, mandatoryGed: ['ENG102', 'ENG103'], coreMath: ['ECO172'], coreBusiness: ['ACT201', 'ACT202'], majorCore: ['FIN254', 'FIN433'] };

class AuditService {
  static getValid(courses) {
    return courses.filter(c => !NON_EARNING.includes(c.grade));
  }

  static totalCredits(courses) {
    return this.getValid(courses).reduce((sum, c) => sum + c.credits, 0);
  }

  static cgpa(courses) {
    const valid = this.getValid(courses);
    let gp = 0, ca = 0;
    for (const c of valid) {
      if (c.credits > 0 && GRADE_POINTS[c.grade]) {
        gp += GRADE_POINTS[c.grade] * c.credits;
        ca += c.credits;
      }
    }
    return { cgpa: ca > 0 ? Math.round((gp / ca) * 100) / 100 : 0, credits: ca, gradePoints: gp };
  }

  static audit(courses, program = MOCK_PROGRAM) {
    const valid = this.getValid(courses);
    const completed = new Set(valid.map(c => c.code));
    const missing = { mandatoryGed: [], coreMath: [], coreBusiness: [], majorCore: [] };
    for (const cat of ['mandatoryGed', 'coreMath', 'coreBusiness', 'majorCore']) {
      if (program[cat]) missing[cat] = program[cat].filter(c => !completed.has(c));
    }
    const cgpaData = this.cgpa(courses);
    const credits = this.totalCredits(courses);
    const deficit = Math.max(0, program.totalCredits - credits);
    const eligible = cgpaData.cgpa >= 2.0 && deficit <= 0 && !Object.values(missing).some(a => a.length > 0);
    return {
      level1: { totalCredits: credits, valid: valid.length },
      level2: { cgpa: cgpaData.cgpa, credits: cgpaData.credits },
      level3: { eligible, creditDeficit: deficit, missingCourses: missing }
    };
  }

  static getMockProgram() {
    return MOCK_PROGRAM;
  }
}

module.exports = AuditService;
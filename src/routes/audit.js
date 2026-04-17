const express = require('express');
const { body, param, validationResult, query } = require('express-validator');
const auditController = require('../controllers/auditController');
const auth = require('../middleware/auth');
const apiKeyAuth = require('../middleware/apiKeyAuth');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;
  
  if (apiKey) {
    return apiKeyAuth(req, res, next);
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    return auth(req, res, next);
  }
  
  return res.status(401).json({ error: 'Authentication required. Use x-api-key or Bearer token' });
};

const courseValidation = [
  body('courses').isArray({ min: 1 }).withMessage('Courses must be a non-empty array'),
  body('courses.*.code').notEmpty().withMessage('Course code is required'),
  body('courses.*.credits').isInt({ min: 0 }).withMessage('Credits must be a non-negative integer'),
  body('courses.*.grade').notEmpty().withMessage('Grade is required'),
  body('courses.*.semester').notEmpty().withMessage('Semester is required'),
  body('program').notEmpty().withMessage('Program name is required'),
  body('waivedCourses').optional().isArray(),
  body('studentName').optional().isString(),
  body('dateOfBirth').optional().isString(),
  body('enrollmentYear').optional().isInt(),
  body('graduationYear').optional().isInt()
];

// List user's audits (must be before /:id route)
router.get('/my/audits', authenticate, auditController.getUserAudits);

router.post('/', authenticate, courseValidation, validateRequest, auditController.runAudit);

router.get('/:id', authenticate, [
  param('id').isMongoId().withMessage('Invalid audit ID')
], validateRequest, auditController.getAudit);

router.get('/:id/pdf', authenticate, [
  param('id').isMongoId().withMessage('Invalid audit ID'),
  query('type').isIn(['transcript', 'certificate']).withMessage('Type must be "transcript" or "certificate"')
], validateRequest, auditController.generateAuditPdf);

router.get('/', auditController.getPrograms);

module.exports = router;

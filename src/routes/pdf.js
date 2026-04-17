const express = require('express');
const { body, validationResult, query } = require('express-validator');
const pdfController = require('../controllers/pdfController');
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
  
  return res.status(401).json({ error: 'Authentication required' });
};

const transcriptValidation = [
  body('name').notEmpty().withMessage('Student name is required'),
  body('id').notEmpty().withMessage('Student ID is required'),
  body('semesters').isArray({ min: 1 }).withMessage('At least one semester is required')
];

router.post('/transcript', authenticate, transcriptValidation, validateRequest, pdfController.generateTranscript);

router.post('/certificate', authenticate, [
  body('name').notEmpty().withMessage('Student name is required'),
  body('id').notEmpty().withMessage('Student ID is required'),
  body('program').notEmpty().withMessage('Program is required')
], validateRequest, pdfController.generateCertificate);

// Direct PDF generation from student data (for test students)
router.post('/direct/transcript', authenticate, pdfController.generateDirectTranscript);
router.post('/direct/certificate', authenticate, pdfController.generateDirectCertificate);

module.exports = router;

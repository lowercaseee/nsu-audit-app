const express = require('express');
const router = express.Router();
const { processTranscript } = require('../controllers/transcriptController');
const jwtMiddleware = require('../middleware/jwtMiddleware');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// POST /process-transcript - requires JWT or API key
router.post('/process-transcript', authMiddleware, processTranscript);

module.exports = router;
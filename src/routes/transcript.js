const express = require('express');
const router = express.Router();
const TranscriptService = require('../services/transcriptService');
const HistoryService = require('../services/historyService');

router.post('/', async (req, res) => {
  try {
    const result = TranscriptService.process();
    const pdfBuffer = await TranscriptService.generatePdf(result.student, result.audit);
    
    HistoryService.log('POST /process-transcript', true);
    res.json({ ...result, pdf: pdfBuffer.toString('base64') });
  } catch (e) {
    HistoryService.log('POST /process-transcript', false);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

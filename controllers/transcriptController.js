const AuditService = require('../services/auditService');
const TranscriptService = require('../src/services/transcriptService');
const PdfService = require('../src/services/pdfService');
const HistoryService = require('../services/historyService');
const CertificateService = require('../services/certificateService');

async function processTranscript(req, res) {
  try {
    const user = req.user?.email || req.apiKeyUser;
    let result;
    
    if (req.body.courses && Array.isArray(req.body.courses)) {
      const audit = AuditService.audit(req.body.courses, AuditService.getMockProgram());
      result = TranscriptService.buildResult(null, req.body.courses, audit);
    } else {
      let imageBuffer = null;
      if (req.body.image) {
        try {
          const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
          imageBuffer = Buffer.from(base64Data, 'base64');
        } catch (e) {
          return res.status(400).json({ error: 'Invalid image format. Please provide a valid base64 encoded image.' });
        }
      }
      result = await TranscriptService.process(imageBuffer, user);
    }
    
    const pdf = await PdfService.generate(result);
    const certInfo = CertificateService.save(user, pdf, result.student.name);
    
    HistoryService.log('POST /process-transcript', user, true);
    res.json({ ...result, pdf: pdf.toString('base64'), certificate: certInfo });
  } catch (e) {
    const user = req.user?.email || req.apiKeyUser;
    console.log('Transcript processing error:', e.message);
    HistoryService.log('POST /process-transcript', user, false);
    res.status(500).json({ error: 'Failed to process transcript: ' + e.message });
  }
}

module.exports = { processTranscript };
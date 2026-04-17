require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { Server } = require('socket.io');
const http = require('http');

const AuthService = require('./src/services/authService');
const HistoryService = require('./services/historyService');
const AuditService = require('./services/auditService');
const TranscriptService = require('./src/services/transcriptService');
const PdfService = require('./src/services/pdfService');
const CertificateService = require('./services/certificateService');
const transcriptRoutes = require('./routes/transcriptRoutes');
const jwtMiddleware = require('./middleware/jwtMiddleware');
const apiKeyMiddleware = require('./middleware/apiKeyMiddleware');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const PORT = process.env.PORT || 5000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '871051854278-tgov2na9jbu53n5680n9e3qpdlvh338b.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// In-memory job storage
const jobs = {};

// Helper to emit job logs
function emitJobLog(jobId, log) {
  io.to(`job:${jobId}`).emit('jobLog', { jobId, log, timestamp: new Date().toISOString() });
}

// Download existing certificate image
app.get('/certificate-image', (req, res) => {
  const certPath = require('path').join(__dirname, 'processed_images', 'certificate.png');
  if (require('fs').existsSync(certPath)) {
    res.sendFile(certPath);
  } else {
    res.status(404).json({ error: 'Certificate not found' });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.send('Server working');
});

// CLI Login (for device flow)
app.post('/auth/cli-login', async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'Missing access_token' });
    
    const response = await client.getTokenInfo(access_token);
    const payload = { email: response.email, name: response.name, picture: response.picture, sub: response.sub };
    
    if (!payload.email.endsWith('@northsouth.edu')) {
      HistoryService.log('POST /auth/cli-login', payload.email, false);
      return res.status(403).json({ error: 'Only @northsouth.edu emails allowed' });
    }
    
    const user = AuthService.findOrCreate({ email: payload.email, name: payload.name || payload.email.split('@')[0], picture: payload.picture, googleId: payload.sub });
    const token = AuthService.generateToken(user);
    HistoryService.log('POST /auth/cli-login', user.email, true);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
  } catch (e) {
    HistoryService.log('POST /auth/cli-login', 'unknown', false);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Google Auth
app.post('/auth/google', async (req, res) => {
  try {
    const { credential, access_token } = req.body;
    let payload;
    
    if (credential) {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } else if (access_token) {
      const response = await client.getTokenInfo(access_token);
      payload = { email: response.email, name: response.name, picture: response.picture, sub: response.sub };
    } else {
      return res.status(400).json({ error: 'Missing token' });
    }
    
    if (!payload.email.endsWith('@northsouth.edu')) {
      HistoryService.log('POST /auth/google', payload.email, false);
      return res.status(403).json({ error: 'Only @northsouth.edu emails allowed' });
    }
    
    const user = AuthService.findOrCreate({ email: payload.email, name: payload.name || payload.email.split('@')[0], picture: payload.picture, googleId: payload.sub });
    const token = AuthService.generateToken(user);
    HistoryService.log('POST /auth/google', user.email, true);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
  } catch (e) {
    HistoryService.log('POST /auth/google', 'unknown', false);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Generate API Key
app.post('/generate-key', (req, res) => {
  const newKey = AuthService.generateApiKey(req.body.name || 'CLI');
  HistoryService.log('POST /generate-key', 'system', true);
  res.json({ apiKey: newKey.key, name: newKey.name });
});

// API History - requires JWT or API key, returns only current user's logs
app.get('/api-history', authMiddleware, (req, res) => {
  const user = req.user?.email || req.apiKeyUser;
  HistoryService.log('GET /api-history', user, true);
  const userHistory = HistoryService.getByUser(user);
  res.json({ history: userHistory });
});

// Get user's certificates
app.get('/certificates', authMiddleware, (req, res) => {
  const user = req.user?.email || req.apiKeyUser;
  const certs = CertificateService.getByUser(user);
  res.json({ certificates: certs });
});

// Download certificate
app.get('/certificates/:filename', authMiddleware, (req, res) => {
  const user = req.user?.email || req.apiKeyUser;
  const { filename } = req.params;
  const certs = CertificateService.getByUser(user);
  if (!certs.find(c => c.filename === filename)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const pdf = CertificateService.getFile(filename);
  if (!pdf) return res.status(404).json({ error: 'Certificate not found' });
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});

// Use transcript routes
app.use('/', transcriptRoutes);

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('subscribe', (jobId) => socket.join(`job:${jobId}`));
  socket.on('unsubscribe', (jobId) => socket.leave(`job:${jobId}`));
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Process Transcript (async)
app.post('/process-transcript-async', async (req, res) => {
  try {
    const user = req.user?.email || req.apiKeyUser || 'unknown';
    const jobId = crypto.randomUUID();
    jobs[jobId] = { status: 'processing', user, createdAt: new Date().toISOString() };
    emitJobLog(jobId, { level: 'info', message: `Job started: ${jobId}`, user });

    (async () => {
      try {
        let result;
        emitJobLog(jobId, { level: 'info', message: 'Parsing request data...', user });
        
        if (req.body.courses && Array.isArray(req.body.courses)) {
          emitJobLog(jobId, { level: 'info', message: `Processing ${req.body.courses.length} courses...`, user });
          const audit = AuditService.audit(req.body.courses, AuditService.getMockProgram());
          emitJobLog(jobId, { level: 'info', message: 'Running audit checks...', user });
          result = {
            student: { name: 'Test Student', id: '000000000', dob: 'N/A', degree: 'Bachelor of Business Administration' },
            courses: req.body.courses,
            summary: { totalCredits: audit.level1.totalCredits, cgpa: audit.level2.cgpa, degreeCompleted: 'N/A' },
            audit,
            result: audit.level3.eligible ? 'GRADUATED' : 'NOT GRADUATED'
          };
        } else {
          let imageBuffer = null;
          if (req.body.image) {
            emitJobLog(jobId, { level: 'info', message: 'Receiving image data...', user });
            const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
            emitJobLog(jobId, { level: 'info', message: 'Running OCR on image...', user });
          } else {
            emitJobLog(jobId, { level: 'info', message: 'Using demo data (no image provided)...', user });
          }
          emitJobLog(jobId, { level: 'info', message: 'Processing transcript...', user });
          result = imageBuffer ? await TranscriptService.process(imageBuffer, user) : await TranscriptService.process(null, user);
        }
        
        emitJobLog(jobId, { level: 'info', message: 'Generating PDF certificate...', user });
        const pdf = await PdfService.generate(result);
        jobs[jobId] = { status: 'completed', result: { ...result, pdf: pdf.toString('base64') }, user };
        emitJobLog(jobId, { level: 'success', message: `Audit complete: ${result.result}`, user, audit: result.audit });
        emitJobLog(jobId, { level: 'info', message: `Total Credits: ${result.audit.level1.totalCredits}`, user });
        emitJobLog(jobId, { level: 'info', message: `CGPA: ${result.audit.level2.cgpa}`, user });
        HistoryService.log('POST /process-transcript-async', user, true);
      } catch (e) {
        jobs[jobId] = { status: 'failed', error: e.message, user };
        emitJobLog(jobId, { level: 'error', message: `Error: ${e.message}`, user });
        HistoryService.log('POST /process-transcript-async', user, false);
      }
    })();
    
    HistoryService.log('POST /process-transcript-async', user, true);
    res.json({ jobId, status: 'processing', message: 'Job started' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get job status
app.get('/job/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ jobId: req.params.jobId, ...job });
});

// Start server
server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Test:        http://localhost:${PORT}/test`);
  console.log(`Google Auth: http://localhost:${PORT}/auth/google`);
  console.log(`WebSocket:   ws://localhost:${PORT}`);
  console.log(`========================================`);
});

module.exports = app;
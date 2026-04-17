const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const AuthService = require('../services/authService');
const HistoryService = require('../services/historyService');
const { authenticateAny } = require('../middleware/auth');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '871051854278-tgov2na9jbu53n5680n9e3qpdlvh338b.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /generate-key
router.post('/generate-key', (req, res) => {
  const newKey = AuthService.generateApiKey(req.body.name || 'CLI');
  HistoryService.log('POST /generate-key', 'system', true);
  res.json({ apiKey: newKey.key, name: newKey.name });
});

// GET /api-history
router.get('/api-history', authenticateAny, (req, res) => {
  const user = req.user?.email || req.apiKeyUser || 'unknown';
  HistoryService.log('GET /api-history', user, true);
  const history = HistoryService.getAll();
  const formatted = history.map(h => ({
    user: h.user,
    endpoint: h.endpoint,
    timestamp: h.timestamp,
    status: h.success ? 'success' : 'failed'
  }));
  res.json({ history: formatted });
});

module.exports = router;
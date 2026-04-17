const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const AuthService = require('../services/authService');
const HistoryService = require('../services/historyService');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '871051854278-tgov2na9jbu53n5680n9e3qpdlvh338b.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/google-login', async (req, res) => {
  try {
    const { credential } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    
    if (!email.endsWith('@northsouth.edu')) {
      return res.status(403).json({ error: 'Only @northsouth.edu emails allowed' });
    }
    
    const user = AuthService.findOrCreate({
      email,
      name: payload.name,
      picture: payload.picture
    });
    
    const token = AuthService.generateToken(user);
    
    HistoryService.log('POST /google-login', true);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
  } catch (e) {
    HistoryService.log('POST /google-login', false);
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/generate-key', (req, res) => {
  const newKey = AuthService.generateKey(req.body.name || 'API Key');
  HistoryService.log('POST /generate-key', true);
  res.json({ apiKey: newKey.key, name: newKey.name });
});

module.exports = router;

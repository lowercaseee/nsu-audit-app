const AuthService = require('../services/authService');

function authenticateJwt(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Authorization header' });
  const decoded = AuthService.verifyToken(auth.split(' ')[1]);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });
  req.user = decoded;
  next();
}

function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'Missing x-api-key' });
  const valid = AuthService.validateApiKey(apiKey);
  if (!valid) return res.status(401).json({ error: 'Invalid API key' });
  req.apiKeyUser = valid.name;
  next();
}

function authenticateAny(req, res, next) {
  const auth = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  if (auth?.startsWith('Bearer ')) {
    const decoded = AuthService.verifyToken(auth.split(' ')[1]);
    if (decoded) { req.user = decoded; return next(); }
  }
  if (apiKey) {
    const valid = AuthService.validateApiKey(apiKey);
    if (valid) { req.apiKeyUser = valid.name; return next(); }
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { authenticateJwt, authenticateApiKey, authenticateAny };
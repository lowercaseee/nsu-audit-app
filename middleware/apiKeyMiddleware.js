const AuthService = require('../src/services/authService');

function apiKeyMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }
  const valid = AuthService.validateApiKey(apiKey);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  req.apiKeyUser = valid.name;
  next();
}

module.exports = apiKeyMiddleware;
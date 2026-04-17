const AuthService = require('../src/services/authService');

function authMiddleware(req, res, next) {
  // Check for JWT token
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.split(' ')[1];
    const decoded = AuthService.verifyToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
  }
  
  // Check for API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    const valid = AuthService.validateApiKey(apiKey);
    if (valid) {
      req.apiKeyUser = valid.name;
      return next();
    }
  }
  
  return res.status(401).json({ error: 'Unauthorized - provide JWT or API key' });
}

module.exports = authMiddleware;
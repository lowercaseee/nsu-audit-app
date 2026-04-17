const ApiKey = require('../models/ApiKey');

const errorResponse = (res, message, statusCode) => {
  res.status(statusCode).json({
    status: 'error',
    message
  });
};

const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return errorResponse(res, 'API key is required. Use x-api-key header.', 401);
    }
    
    if (apiKey.length < 10) {
      return errorResponse(res, 'Invalid API key format', 401);
    }
    
    const validKey = await ApiKey.findOne({ key: apiKey, isActive: true });
    
    if (!validKey) {
      return errorResponse(res, 'Invalid or inactive API key', 401);
    }
    
    if (validKey.expiresAt && new Date() > validKey.expiresAt) {
      return errorResponse(res, 'API key has expired. Please generate a new key.', 401);
    }
    
    validKey.lastUsedAt = new Date();
    await validKey.save();
    
    req.userId = validKey.userId;
    req.apiKeyId = validKey._id;
    
    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return errorResponse(res, 'API key authentication failed', 500);
  }
};

module.exports = apiKeyAuth;

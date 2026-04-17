const ApiKey = require('../models/ApiKey');

const successResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    status: 'success',
    ...data
  });
};

const errorResponse = (res, message, statusCode) => {
  res.status(statusCode).json({
    status: 'error',
    message
  });
};

const createApiKey = async (req, res) => {
  try {
    let { name, expiresInDays = 365 } = req.body;
    
    if (expiresInDays < 1 || expiresInDays > 365) {
      return errorResponse(res, 'Expiry days must be between 1 and 365', 400);
    }
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    const apiKey = new ApiKey({
      userId: req.userId,
      name: name || 'API Key',
      expiresAt
    });
    
    await apiKey.save();
    
    successResponse(res, {
      data: {
        id: apiKey._id,
        key: apiKey.key,
        name: apiKey.name,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt
      }
    }, 201);
  } catch (error) {
    console.error('Create API key error:', error);
    return errorResponse(res, 'Failed to create API key', 500);
  }
};

const getApiKeys = async (req, res) => {
  try {
    const apiKeys = await ApiKey.find({ userId: req.userId })
      .select('-key')
      .sort({ createdAt: -1 });
    
    successResponse(res, { data: apiKeys });
  } catch (error) {
    console.error('Get API keys error:', error);
    return errorResponse(res, 'Failed to retrieve API keys', 500);
  }
};

const revokeApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!apiKey) {
      return errorResponse(res, 'API key not found', 404);
    }
    
    apiKey.isActive = false;
    await apiKey.save();
    
    successResponse(res, { message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid API key ID', 400);
    }
    return errorResponse(res, 'Failed to revoke API key', 500);
  }
};

module.exports = {
  createApiKey,
  getApiKeys,
  revokeApiKey
};

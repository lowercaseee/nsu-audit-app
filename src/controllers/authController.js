const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const successResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    status: 'success',
    ...data
  });
};

const errorResponse = (res, message, statusCode, errors = null) => {
  const response = { status: 'error', message };
  if (errors) response.errors = errors;
  res.status(statusCode).json(response);
};

const googleAuth = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return errorResponse(res, 'Google token is required', 400);
    }
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    if (!payload.email.endsWith('@northsouth.edu')) {
      return errorResponse(res, 'Only North South University emails are allowed', 403);
    }
    
    let user = await User.findOne({ googleId: payload.sub });
    
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      });
    } else {
      user.name = payload.name;
      user.picture = payload.picture;
      await user.save();
    }
    
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    successResponse(res, {
      token: jwtToken,
      user: {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    }, 201);
  } catch (error) {
    console.error('Google auth error:', error);
    if (error.message.includes('Invalid token')) {
      return errorResponse(res, 'Invalid or expired Google token', 401);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
};

const getMe = async (req, res) => {
  try {
    successResponse(res, {
      user: {
        id: req.user._id,
        googleId: req.user.googleId,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    return errorResponse(res, 'Failed to retrieve user information', 500);
  }
};

const manualLogin = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!normalizedEmail.endsWith('@northsouth.edu')) {
      return errorResponse(res, 'Only North South University emails are allowed', 403);
    }
    
    let user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      user = await User.create({
        googleId: `manual_${normalizedEmail}`,
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        picture: null
      });
    }
    
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    successResponse(res, {
      token: jwtToken,
      user: {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    }, 201);
  } catch (error) {
    console.error('Manual login error:', error);
    return errorResponse(res, 'Login failed', 500);
  }
};

module.exports = {
  googleAuth,
  getMe,
  manualLogin
};

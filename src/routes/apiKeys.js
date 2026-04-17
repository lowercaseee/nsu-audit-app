const express = require('express');
const { body, validationResult } = require('express-validator');
const apiKeyController = require('../controllers/apiKeyController');
const auth = require('../middleware/auth');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/', auth, [
  body('name').optional().isString(),
  body('expiresInDays').optional().isInt({ min: 1, max: 365 })
], validateRequest, apiKeyController.createApiKey);

router.get('/', auth, apiKeyController.getApiKeys);

router.delete('/:id', auth, apiKeyController.revokeApiKey);

module.exports = router;

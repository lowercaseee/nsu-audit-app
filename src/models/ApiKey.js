const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: 'API Key'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  lastUsedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

apiKeySchema.pre('save', function(next) {
  if (!this.key) {
    this.key = 'nsu_' + crypto.randomBytes(24).toString('hex');
  }
  next();
});

module.exports = mongoose.model('ApiKey', apiKeySchema);

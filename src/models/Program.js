const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  degree: {
    type: String,
    required: true
  },
  totalCredits: {
    type: Number,
    required: true
  },
  mandatoryGed: [{
    type: String
  }],
  coreMath: [{
    type: String
  }],
  coreBusiness: [{
    type: String
  }],
  majorCore: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Program', programSchema);

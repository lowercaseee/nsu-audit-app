const express = require('express');
const router = express.Router();
const HistoryService = require('../services/historyService');

router.get('/api-history', (req, res) => {
  HistoryService.log('GET /api-history', true);
  res.json({ history: HistoryService.getAll() });
});

module.exports = router;

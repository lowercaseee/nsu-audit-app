const express = require('express');
const router = express.Router();

router.post('/upload-transcript', async (req, res) => {
  try {
    const fakeText = `
Student Name: Rubayat Sarwar Chowdhury
Student ID: 071415030

ACT101 A 3.0 Spring 2007
ENG102 B+ 3.0 Spring 2007
CSE115 A 3.0 Fall 2007
CSE173 B+ 3.0 Fall 2007
CSE215 A 3.0 Spring 2008
CSE225 B 3.0 Spring 2008
CSE231 A- 3.0 Fall 2008
CSE311 B+ 3.0 Fall 2008
CSE323 A 3.0 Spring 2009
CSE327 B+ 3.0 Spring 2009
CSE331 A 3.0 Fall 2009
CSE332 B 3.0 Fall 2009
ENG101 A 3.0 Fall 2007
MAT116 A 3.0 Fall 2007
MAT120 B+ 3.0 Spring 2008
PHY107 A 3.0 Spring 2008
    `.trim();

    res.json({ text: fakeText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

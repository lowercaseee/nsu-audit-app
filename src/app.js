const express = require('express');
const transcriptRoutes = require('./routes/transcript');
const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');
const authenticateApiKey = require('./middleware/auth');
const authenticateJwt = require('./middleware/auth');

const app = express();

app.use(express.json());

app.get('/test', (req, res) => res.send('Server working'));

app.use('/', authRoutes);
app.use('/', historyRoutes);
app.use('/process-transcript', authenticateJwt, transcriptRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

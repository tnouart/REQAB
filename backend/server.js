const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/workflow', require('./routes/workflow'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/references', require('./routes/references'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/excel', require('./routes/excel'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/signatures', require('./routes/signatures'));
app.use('/api/destructions', require('./routes/destructions'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/non-conformites', require('./routes/nonconformities'));
app.use('/uploads', express.static('uploads'));

app.get('/api/documents/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier introuvable' });
  }
  res.download(filePath);
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Document Management API is running!' });
});

// Start server
app.listen(port, () => {
  console.log('Server is running on port ' + port);
});

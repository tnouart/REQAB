const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/workflow', require('./backend/routes/workflow'));
app.use('/api/documents', require('./backend/routes/documents'));
app.use('/api/references', require('./backend/routes/references'));
app.use('/api/settings', require('./backend/routes/settings'));
app.use('/api/excel', require('./backend/routes/excel'));
app.use('/api/audit', require('./backend/routes/audit'));
app.use('/api/signatures', require('./backend/routes/signatures'));
app.use('/api/destructions', require('./backend/routes/destructions'));
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/users', require('./backend/routes/users'));
app.use('/api/non-conformites', require('./backend/routes/nonconformities'));
app.use('/api/ptw', require('./backend/routes/ptw'));
app.use('/api/hira', require('./backend/routes/hira'));
app.use('/api/aei', require('./backend/routes/aei'));
app.use('/api/incidents', require('./backend/routes/incidents'));
app.use('/api/habilitations', require('./backend/routes/habilitations'));
app.use('/api/indicateurs-env', require('./backend/routes/indicateurs_env'));
app.use('/api/conformites', require('./backend/routes/conformites'));
app.use('/api/notifications', require('./backend/routes/notifications'));
app.use('/api/rapport', require('./backend/routes/rapport'));
app.use('/api/reports', require('./backend/routes/reports'));

app.get('/api/documents/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'backend/uploads', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier introuvable' });
  }
  res.download(filePath);
});

app.get('/', (req, res) => {
  res.json({ message: 'Document Management API is running!' });
});

module.exports = app;
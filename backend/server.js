const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/workflow', require('./routes/workflow'));
app.use('/documents', require('./routes/documents'));
app.use('/references', require('./routes/references'));
app.use('/settings', require('./routes/settings'));
app.use('/excel', require('./routes/excel'));
app.use('/audit', require('./routes/audit'));
app.use('/signatures', require('./routes/signatures'));
app.use('/destructions', require('./routes/destructions'));
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/non-conformites', require('./routes/nonconformities'));
app.use('/ptw', require('./routes/ptw'));
app.use('/hira', require('./routes/hira'));
app.use('/aei', require('./routes/aei'));
app.use('/incidents', require('./routes/incidents'));
app.use('/habilitations', require('./routes/habilitations'));
app.use('/indicateurs-env', require('./routes/indicateurs_env'));
app.use('/conformites', require('./routes/conformites'));
app.use('/notifications', require('./routes/notifications'));
app.use('/rapport', require('./routes/rapport'));
app.use('/reports', require('./routes/reports'));

app.get('/documents/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier introuvable' });
  }
  res.download(filePath);
});

app.get('/', (req, res) => {
  res.json({ message: 'Document Management API is running!' });
});

module.exports = app;

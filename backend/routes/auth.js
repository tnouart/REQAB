const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-in-production';

// Données mock pour le prototype
const MOCK_USERS = [
  { email: 'admin@qualite.com', nom: 'Administrateur', role: 'ADMIN' },
  { email: 'qualite@qualite.com', nom: 'Resp. Qualité', role: 'RESPONSABLE_QUALITE' },
  { email: 'user@qualite.com', nom: 'Rédacteur', role: 'REDACTEUR' },
  { email: 'viewer@qualite.com', nom: 'Lecteur', role: 'LECTEUR' }
];

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Mode prototype: utiliser les mock users
  const user = MOCK_USERS.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }
  
  // En production: vérifier bcrypt.compare(password, user.password_hash)
  const token = jwt.sign({ id: 1, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-in-production';

router.post('/login', async (req, res) => {
  const { matricule, password } = req.body;
  
  if (!matricule || !password) {
    return res.status(400).json({ error: 'Matricule et mot de passe requis' });
  }
  
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.prenom, u.nom, u.matricule, u.actif, u.mot_de_passe_hash,
       COALESCE(json_agg(json_build_object('id', r.id, 'code', r.code, 'libelle', r.libelle, 'description', r.description)) FILTER (WHERE r.id IS NOT NULL), '[]') AS roles
       FROM utilisateur u
       LEFT JOIN utilisateur_role ur ON ur.utilisateur_id = u.id
       LEFT JOIN role r ON r.id = ur.role_id
       WHERE u.matricule = $1
       GROUP BY u.id, u.mot_de_passe_hash`,
      [matricule.trim().toUpperCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Matricule inconnu' });
    }
    
    const user = result.rows[0];
    if (!user.actif) {
      return res.status(401).json({ error: 'Compte inactif' });
    }
    
    const inputHash = Buffer.from(password).toString('base64');
    if (user.mot_de_passe_hash !== inputHash) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, roles: user.roles }, JWT_SECRET, { expiresIn: '8h' });
    pool.query('UPDATE utilisateur SET derniere_connexion = NOW() WHERE id = $1', [user.id]).catch(() => {});
    res.json({ token, user: { id: user.id, email: user.email, prenom: user.prenom, nom: user.nom, matricule: user.matricule, roles: user.roles } });
  } catch (err) {
    console.error('Erreur POST /api/auth/login:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

router.post('/online/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE utilisateur SET derniere_connexion = NOW() WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur POST /api/auth/online:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
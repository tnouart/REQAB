const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/users - Liste tous les utilisateurs avec leurs rôles
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.prenom,
        u.nom,
        u.email,
        u.matricule,
        u.processus_id,
        p.code AS processus,
        u.fonction_responsable_id,
        fr.libelle AS fonction_responsable,
        u.actif,
        u.derniere_connexion,
        u.date_creation,
        u.mot_de_passe_hash,
        COALESCE(
          json_agg(
            json_build_object(
              'id', r.id,
              'code', r.code,
              'libelle', r.libelle,
              'description', r.description
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS roles
      FROM utilisateur u
      LEFT JOIN processus p ON p.id = u.processus_id
      LEFT JOIN fonction_responsable fr ON fr.id = u.fonction_responsable_id
      LEFT JOIN utilisateur_role ur ON ur.utilisateur_id = u.id
      LEFT JOIN role r ON r.id = ur.role_id
      GROUP BY u.id, p.code, fr.libelle
      ORDER BY u.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur GET /api/users:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/users/:id - Détail d'un utilisateur
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        u.id,
        u.prenom,
        u.nom,
        u.email,
        u.matricule,
        u.processus_id,
        p.code AS processus,
        u.fonction_responsable_id,
        fr.libelle AS fonction_responsable,
        u.actif,
        u.derniere_connexion,
        u.date_creation,
        COALESCE(
          json_agg(
            json_build_object(
              'id', r.id,
              'code', r.code,
              'libelle', r.libelle,
              'description', r.description
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS roles
      FROM utilisateur u
      LEFT JOIN processus p ON p.id = u.processus_id
      LEFT JOIN fonction_responsable fr ON fr.id = u.fonction_responsable_id
      LEFT JOIN utilisateur_role ur ON ur.utilisateur_id = u.id
      LEFT JOIN role r ON r.id = ur.role_id
      WHERE u.id = $1
      GROUP BY u.id, p.code, fr.libelle
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur GET /api/users/:id:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/users - Créer un utilisateur
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { matricule, prenom, nom, email, mot_de_passe, processus_id, fonction_responsable_id, roles } = req.body;

    if (!matricule || !prenom || !nom || !email || !roles || roles.length === 0) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    await client.query('BEGIN');

    // Vérifier si l'email existe déjà
    const existing = await client.query('SELECT id FROM utilisateur WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe (simplifié pour la démo)
    const mot_de_passe_hash = mot_de_passe ? Buffer.from(mot_de_passe).toString('base64') : Buffer.from('password123').toString('base64');

    // Insérer l'utilisateur
    const userResult = await client.query(
      `INSERT INTO utilisateur (prenom, nom, email, mot_de_passe_hash, processus_id, fonction_responsable_id, actif, date_creation, matricule)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
       RETURNING id, prenom, nom, email, processus_id, fonction_responsable_id, actif, date_creation, matricule`,
      [prenom, nom, email, mot_de_passe_hash, processus_id || null, fonction_responsable_id || null, true, matricule]
    );

    const newUser = userResult.rows[0];

    // Assigner les rôles
    for (const roleId of roles) {
      await client.query(
        'INSERT INTO utilisateur_role (utilisateur_id, role_id) VALUES ($1, $2)',
        [newUser.id, roleId]
      );
    }

    await client.query('COMMIT');

    // Récupérer l'utilisateur complet avec ses rôles
    const fullUser = await pool.query(`
      SELECT
        u.id, u.prenom, u.nom, u.email, u.matricule, u.processus_id,
        p.code AS processus,
        u.fonction_responsable_id,
        fr.libelle AS fonction_responsable,
        u.actif, u.derniere_connexion, u.date_creation,
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'code', r.code, 'libelle', r.libelle, 'description', r.description)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS roles
      FROM utilisateur u
      LEFT JOIN processus p ON p.id = u.processus_id
      LEFT JOIN fonction_responsable fr ON fr.id = u.fonction_responsable_id
      LEFT JOIN utilisateur_role ur ON ur.utilisateur_id = u.id
      LEFT JOIN role r ON r.id = ur.role_id
      WHERE u.id = $1
      GROUP BY u.id, p.code, fr.libelle
    `, [newUser.id]);

    res.status(201).json(fullUser.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur POST /api/users:', err.message);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// PUT /api/users/:id/roles - Mettre à jour les rôles d'un utilisateur
router.put('/:id/roles', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { roles } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({ error: 'roles doit être un tableau' });
    }

    await client.query('BEGIN');

    // Supprimer les rôles existants
    await client.query('DELETE FROM utilisateur_role WHERE utilisateur_id = $1', [id]);

    // Insérer les nouveaux rôles
    for (const roleId of roles) {
      await client.query(
        'INSERT INTO utilisateur_role (utilisateur_id, role_id) VALUES ($1, $2)',
        [id, roleId]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Rôles mis à jour' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur PUT /api/users/:id/roles:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// PUT /api/users/:id/active - Activer/désactiver un utilisateur
router.put('/:id/active', async (req, res) => {
  try {
    const { id } = req.params;
    const { actif } = req.body;

    const result = await pool.query(
      'UPDATE utilisateur SET actif = $1 WHERE id = $2 RETURNING id, actif',
      [actif, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur PUT /api/users/:id/active:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/users/:id - Mettre à jour les informations d'un utilisateur
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { matricule, prenom, nom, email, processus_id, fonction_responsable_id, actif } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (matricule !== undefined) {
      updates.push(`matricule = $${paramCount++}`);
      values.push(matricule);
    }
    if (prenom !== undefined) {
      updates.push(`prenom = $${paramCount++}`);
      values.push(prenom);
    }
    if (nom !== undefined) {
      updates.push(`nom = $${paramCount++}`);
      values.push(nom);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (processus_id !== undefined) {
      updates.push(`processus_id = $${paramCount++}`);
      values.push(processus_id || null);
    }
    if (fonction_responsable_id !== undefined) {
      updates.push(`fonction_responsable_id = $${paramCount++}`);
      values.push(fonction_responsable_id || null);
    }
    if (actif !== undefined) {
      updates.push(`actif = $${paramCount++}`);
      values.push(actif);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    values.push(id);
    const query = `UPDATE utilisateur SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, prenom, nom, email, matricule, processus_id, fonction_responsable_id, actif, date_creation`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur PUT /api/users/:id:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/roles - Liste tous les rôles disponibles
router.get('/roles/list', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, code, libelle, description FROM role ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur GET /api/roles:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/processus - Liste tous les processus
router.get('/processus/list', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, code, libelle FROM processus ORDER BY code');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur GET /api/processus:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/users/:id/password - Changer le mot de passe d'un utilisateur
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { mot_de_passe, nouveau_mot_de_passe } = req.body;

    if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    }

    // Hash du nouveau mot de passe
    const nouveau_mot_de_passe_hash = Buffer.from(nouveau_mot_de_passe).toString('base64');

    const result = await pool.query(
      'UPDATE utilisateur SET mot_de_passe_hash = $1 WHERE id = $2 RETURNING id, email',
      [nouveau_mot_de_passe_hash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, message: 'Mot de passe mis à jour' });
  } catch (err) {
    console.error('Erreur PUT /api/users/:id/password:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

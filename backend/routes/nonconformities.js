const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT nc.id, nc.numero_nc, nc.description, nc.criticite, nc.statut, nc.date_detection, nc.delai_traitement, nc.jours_retard,
             nc.document_id, d.codification as document_code, r.titre as document_titre,
             nc.detecte_lors_de, nc.responsable_traitement, nc.action_corrective, nc.type_nc
      FROM non_conformite nc
      LEFT JOIN document d ON nc.document_id = d.id
      LEFT JOIN revision_document r ON d.id = r.document_id AND r.numero_revision = 0
      ORDER BY nc.date_detection DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE criticite = 'CRITIQUE') as critiques,
        COUNT(*) FILTER (WHERE criticite = 'MAJEURE') as majeures,
        COUNT(*) FILTER (WHERE criticite = 'MINEURE') as mineures,
        COUNT(*) FILTER (WHERE statut = 'CLOTUREE') as cloturees,
        COUNT(*) FILTER (WHERE statut = 'OUVERTE') as ouvertes,
        COUNT(*) FILTER (WHERE statut = 'EN_COURS') as en_cours
      FROM non_conformite
      WHERE date_detection >= CURRENT_DATE - INTERVAL '12 months'
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      type_nc,
      criticite,
      description,
      document_id,
      detecte_lors_de,
      responsable_traitement,
      delai_traitement
    } = req.body;
    
    const maxResult = await pool.query(
      `SELECT MAX(numero_nc) as max_nc FROM non_conformite`
    );
    const year = new Date().getFullYear();
    const maxN = parseInt(maxResult.rows[0].max_nc?.split('-')[2] || '0');
    const nextNum = `NC-${year}-${String(maxN + 1).padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO non_conformite 
       (type_nc, criticite, description, document_id, detecte_lors_de, responsable_traitement, delai_traitement, numero_nc, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OUVERTE')
       RETURNING *`,
      [type_nc, criticite, description, document_id || null, detecte_lors_de, responsable_traitement, delai_traitement, nextNum]
    );
    
    const logAudit = async (req, action, oldData = null, newData = null) => {
      await pool.query(
        `INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_email, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['non_conformite', result.rows[0].id, action, 
         JSON.stringify(oldData), JSON.stringify(newData),
         req.headers['x-user-email'] || 'anonymous', req.ip]
      );
    };
    await logAudit(req, 'CREATE', null, result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action_corrective, statut } = req.body;
    
    const oldResult = await pool.query('SELECT * FROM non_conformite WHERE id = $1', [id]);
    
    const result = await pool.query(
      `UPDATE non_conformite 
       SET action_corrective = COALESCE($1, action_corrective),
           statut = COALESCE($2, statut),
           date_cloture = CASE WHEN $2 = 'CLOTUREE' THEN NOW() ELSE date_cloture END
       WHERE id = $3
       RETURNING *`,
      [action_corrective, statut, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'NC non trouvée' });
    }
    
    const logAudit = async (req, action, oldData = null, newData = null) => {
      await pool.query(
        `INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_email, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['non_conformite', id, action, 
         JSON.stringify(oldData), JSON.stringify(newData),
         req.headers['x-user-email'] || 'anonymous', req.ip]
      );
    };
    await logAudit(req, 'UPDATE', oldResult.rows[0], result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
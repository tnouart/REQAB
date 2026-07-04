const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.id as document_id,
        d.codification,
        r.titre,
        p.libelle as processus,
        r.date_prochaine_revision as echeance,
        (r.date_prochaine_revision - CURRENT_DATE) as jours_restants
      FROM document d
      JOIN revision_document r ON d.id = r.document_id
      LEFT JOIN processus p ON d.processus_id = p.id
      WHERE r.date_prochaine_revision IS NOT NULL
      ORDER BY r.date_prochaine_revision ASC
    `);
    
    const notifications = result.rows.map(row => {
      const jours = parseInt(row.jours_restants);
      let type;
      if (jours < 0) type = 'RETARD';
      else if (jours < 30) type = 'URGENT';
      else type = 'ANTICIPE';
      
      return {
        document: row.codification,
        title: row.titre,
        processus: row.processus || 'DQHSE',
        echeance: row.echeance,
        jours,
        type
      };
    });
    
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/send', async (req, res) => {
  try {
    // TODO: implémenter l'envoi email
    res.json({ message: 'Notifications envoyées (à implémenter)' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
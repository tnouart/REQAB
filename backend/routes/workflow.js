const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/documents', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        d.id AS document_id,
        d.codification,
        d.processus_id,
        p.code AS processus,
        d.niveau_confidentialite_id,
        nc.code AS niveau_confidentialite,
        nc.libelle AS niveau_confidentialite_libelle,
        d.type_document_id,
        td.libelle AS type_document,
        d.lieu_classement_id,
        lc.libelle AS lieu_classement,
        d.methode_classement_id,
        mc.code AS methode_classement,
        mc.libelle AS methode_classement_libelle,
        d.duree_classement,
        d.lieu_archivage_id,
        la.libelle AS lieu_archivage,
        d.duree_archivage,
        d.responsable_destruction_id,
        d.est_externe,
        d.actif,
        d.date_creation,
        d.date_maj,
        r.id AS revision_id,
        r.numero_revision,
        r.titre,
        r.statut,
        r.motif_modification,
        r.date_redaction,
        r.date_revue,
        r.date_approbation,
        r.date_application,
        r.date_prochaine_revision,
        r.date_fin_application,
        r.date_enregistrement,
        r.fichier_nom,
        r.fichier_original,
        r.redacteur_id,
        r.revu_par_id,
        r.approuve_par_id
      FROM document d
      LEFT JOIN LATERAL (
        SELECT *
        FROM revision_document r2
        WHERE r2.document_id = d.id
          AND r2.statut NOT IN ('ARCHIVE', 'OBSOLETE')
        ORDER BY r2.numero_revision DESC
        LIMIT 1
      ) r ON true
      LEFT JOIN processus p ON p.id = d.processus_id
      LEFT JOIN type_document td ON td.id = d.type_document_id
      LEFT JOIN niveau_confidentialite nc ON nc.id = d.niveau_confidentialite_id
      LEFT JOIN lieu lc ON lc.id = d.lieu_classement_id
      LEFT JOIN methode_classement mc ON mc.id = d.methode_classement_id
      LEFT JOIN lieu la ON la.id = d.lieu_archivage_id
      ORDER BY d.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const hasUtilisateur = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'utilisateur'
      ) AS exists
    `);
    
    const hasUserRole = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'utilisateur_role'
      ) AS exists
    `);

    if (hasUtilisateur.rows[0].exists && hasUserRole.rows[0].exists) {
      const users = await pool.query(`
        SELECT u.id, u.email, u.nom, r.code AS role 
        FROM utilisateur u
        LEFT JOIN utilisateur_role ur ON ur.utilisateur_id = u.id
        LEFT JOIN role r ON r.id = ur.role_id
      `);
      return res.json(users.rows);
    }
  } catch (err) {
    console.error(err.message);
  }
  const MOCK_USERS = [
    { id: 1, email: 'admin@qualite.com', nom: 'Administrateur', role: 'ADMIN' },
    { id: 2, email: 'qualite@qualite.com', nom: 'Resp. Qualité', role: 'RESPONSABLE_QUALITE' },
    { id: 3, email: 'user@qualite.com', nom: 'Rédacteur', role: 'REDACTEUR' },
    { id: 4, email: 'viewer@qualite.com', nom: 'Lecteur', role: 'LECTEUR' }
  ];
  res.json(MOCK_USERS);
});

router.post('/transition/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, motif_modification } = req.body;
    const allowed = ['BROUILLON', 'EN_REVUE', 'APPROUVE', 'APPLICABLE', 'OBSOLETE', 'ARCHIVE'];
    if (!allowed.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    const result = await pool.query(
      `UPDATE revision_document
       SET statut = $1,
           motif_modification = COALESCE($2, motif_modification),
           date_enregistrement = now()
       WHERE document_id = $3 AND statut != $1
       RETURNING *`,
      [statut, motif_modification || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Révision non trouvée' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

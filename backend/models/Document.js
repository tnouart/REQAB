const { pool } = require('../config/database');

class Document {
  static async findAll() {
    const result = await pool.query(`
      SELECT
        document_id AS id,
        "N°",
        "TITRE" AS titre,
        processus,
        codification,
        "N° de révision",
        "Date d'application",
        "niveau de confidentialité",
        "type de document",
        "statut de la révision" AS statut,
        "lieu de classement",
        "méthode de classement",
        "durée de classement",
        "lieu d'archivage",
        "durée d'archivage",
        "responsable de destruction"
      FROM v_registre_documentaire
    `);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT
        d.id AS id,
        d.numero_ordre,
        d.type_document_id,
        d.processus_id,
        d.codification,
        d.niveau_confidentialite_id,
        d.lieu_classement_id,
        d.methode_classement_id,
        d.duree_classement,
        d.lieu_archivage_id,
        d.duree_archivage,
        d.responsable_destruction_id,
        d.est_externe,
        d.actif,
        d.date_creation,
        d.date_maj,
        r.titre,
        r.statut AS statut,
        r.numero_revision AS "N° de révision",
        r.date_application AS "Date d'application",
        r.date_prochaine_revision,
        p.code AS processus,
        td.libelle AS "type de document",
        nc.code AS "niveau de confidentialite",
        nc.libelle AS "niveau_confidentialite_libelle",
        lc.libelle AS "lieu_classement",
        mc.code AS "methode_classement",
        mc.libelle AS "methode_classement_libelle",
        la.libelle AS "lieu_archivage",
        fr.libelle AS "responsable de destruction"
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
      LEFT JOIN fonction_responsable fr ON fr.id = d.responsable_destruction_id
      WHERE d.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const {
      numero_ordre,
      type_document_id,
      processus_id,
      codification,
      niveau_confidentialite_id,
      lieu_classement_id,
      methode_classement_id,
      duree_classement,
      lieu_archivage_id,
      duree_archivage,
      responsable_destruction_id,
      est_externe,
      actif,
      titre,
      motif_modification,
      redacteur_id,
      revu_par_id,
      approuve_par_id
    } = data;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const docResult = await client.query(
        'INSERT INTO document (' +
          'numero_ordre, type_document_id, processus_id, codification,' +
          'niveau_confidentialite_id, lieu_classement_id, methode_classement_id,' +
          'duree_classement, lieu_archivage_id, duree_archivage,' +
          'responsable_destruction_id, est_externe, actif' +
        ') VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
        [numero_ordre, type_document_id, processus_id, codification, niveau_confidentialite_id, lieu_classement_id, methode_classement_id, duree_classement, lieu_archivage_id, duree_archivage, responsable_destruction_id, est_externe, actif]
      );
      const document = docResult.rows[0];
      await client.query(
        `INSERT INTO revision_document (
          document_id, numero_revision, titre, statut, motif_modification, fichier_nom, fichier_original,
          redacteur_id, revu_par_id, approuve_par_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [document.id, 0, titre || codification, 'BROUILLON', motif_modification || 'Création initiale', data.fichier_nom || null, data.fichier_original || null, redacteur_id || null, revu_par_id || null, approuve_par_id || null]
      );
      await client.query('COMMIT');
      return document;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async update(id, data) {
    const documentFields = [
      'numero_ordre', 'type_document_id', 'processus_id', 'codification',
      'niveau_confidentialite_id', 'lieu_classement_id', 'methode_classement_id',
      'duree_classement', 'lieu_archivage_id', 'duree_archivage',
      'responsable_destruction_id', 'est_externe', 'actif'
    ];
    const entries = Object.entries(data).filter(([k, v]) => documentFields.includes(k) && v !== undefined && v !== '');
    let document;
    if (entries.length > 0) {
      const setClauses = entries.map(([k], i) => `${k} = $${i + 1}`);
      const values = entries.map(([, v]) => v);
      const result = await pool.query(
        `UPDATE document SET ${setClauses.join(', ')}, date_maj = now() WHERE id = $${values.length + 1} RETURNING *`,
        [...values, id]
      );
      document = result.rows[0];
    } else {
      document = await Document.findById(id);
    }
    const titre = data.titre;
    const motif_modification = data.motif_modification;
    if (document && (titre || motif_modification)) {
      const revResult = await pool.query(
        `UPDATE revision_document SET
          titre = COALESCE($1, titre),
          motif_modification = COALESCE($2, motif_modification)
         WHERE id = (
           SELECT r.id FROM revision_document r
           WHERE r.document_id = $3 AND r.statut NOT IN ('ARCHIVE', 'OBSOLETE')
           ORDER BY r.numero_revision DESC
           LIMIT 1
         )
         RETURNING id, titre, statut`,
        [titre, motif_modification, id]
      );
      if (revResult.rows.length === 0) {
        await pool.query(
          `INSERT INTO revision_document (document_id, numero_revision, titre, statut, motif_modification)
           VALUES ($1, 0, $2, 'BROUILLON', $3)`,
          [id, titre || 'Document sans titre', motif_modification || 'Créé via édition']
        );
      }
    }
    return document;
  }

  static async delete(id) {
    await pool.query('DELETE FROM document WHERE id = $1', [id]);
  }

  static async findRevisions(documentId) {
    const result = await pool.query(`
      SELECT
        id,
        document_id,
        numero_revision,
        titre,
        motif_modification,
        statut,
        date_redaction,
        date_revue,
        date_approbation,
        date_application,
        date_fin_application,
        date_prochaine_revision,
        date_enregistrement,
        fichier_nom
      FROM revision_document
      WHERE document_id = $1
      ORDER BY numero_revision DESC
    `, [documentId]);
    return result.rows;
  }
}

module.exports = Document;
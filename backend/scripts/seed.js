const { pool } = require('../config/database');

async function insertSampleData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const docs = [
      {
        numero_ordre: 1,
        type_document_id: 1,
        processus_id: 1,
        codification: 'PRO.QHSE.GEN.001',
        niveau_confidentialite_id: 2,
        lieu_classement_id: 1,
        methode_classement_id: 1,
        duree_classement: '3 ans',
        lieu_archivage_id: 3,
        duree_archivage: '5 ans',
        responsable_destruction_id: 1,
        est_externe: false,
        actif: true,
        titre: 'Maîtrise des informations documentées',
      },
      {
        numero_ordre: 2,
        type_document_id: 2,
        processus_id: 3,
        codification: 'MOD.DPE.ENG.003',
        niveau_confidentialite_id: 3,
        lieu_classement_id: 2,
        methode_classement_id: 2,
        duree_classement: '2 ans',
        lieu_archivage_id: 3,
        duree_archivage: '3 ans',
        responsable_destruction_id: 2,
        est_externe: false,
        actif: true,
        titre: 'Mode opératoire de maintenance préventive',
      },
      {
        numero_ordre: 3,
        type_document_id: 9,
        processus_id: 11,
        codification: null,
        niveau_confidentialite_id: 1,
        lieu_classement_id: 3,
        methode_classement_id: 1,
        duree_classement: 'Selon version',
        lieu_archivage_id: 3,
        duree_archivage: 'Indéterminée',
        responsable_destruction_id: 4,
        est_externe: true,
        actif: true,
        titre: 'Norme ISO 9001:2015 - Externe',
      },
      {
        numero_ordre: 4,
        type_document_id: 4,
        processus_id: 7,
        codification: 'FOR.DG.COM.002',
        niveau_confidentialite_id: 2,
        lieu_classement_id: 1,
        methode_classement_id: 1,
        duree_classement: '1 an',
        lieu_archivage_id: 1,
        duree_archivage: '2 ans',
        responsable_destruction_id: 3,
        est_externe: false,
        actif: true,
        titre: 'Formulaire d\'évaluation fournisseur',
      },
      {
        numero_ordre: 5,
        type_document_id: 1,
        processus_id: 2,
        codification: 'PRO.RH.REC.001',
        niveau_confidentialite_id: 3,
        lieu_classement_id: 2,
        methode_classement_id: 1,
        duree_classement: '2 ans',
        lieu_archivage_id: 3,
        duree_archivage: '5 ans',
        responsable_destruction_id: 1,
        est_externe: false,
        actif: true,
        titre: 'Procédure de recrutement et intégration',
      },
    ];

    const insertedDocs = [];
    for (const doc of docs) {
      const res = await client.query(
        `INSERT INTO document (
          numero_ordre, type_document_id, processus_id, codification,
          niveau_confidentialite_id, lieu_classement_id, methode_classement_id,
          duree_classement, lieu_archivage_id, duree_archivage,
          responsable_destruction_id, est_externe, actif
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [
          doc.numero_ordre,
          doc.type_document_id,
          doc.processus_id,
          doc.codification,
          doc.niveau_confidentialite_id,
          doc.lieu_classement_id,
          doc.methode_classement_id,
          doc.duree_classement,
          doc.lieu_archivage_id,
          doc.duree_archivage,
          doc.responsable_destruction_id,
          doc.est_externe,
          doc.actif,
        ]
      );
      const docId = res.rows[0].id;
      insertedDocs.push({ id: docId, titre: doc.titre });
    }

    const revisions = [
      { document_id: insertedDocs[0].id, numero_revision: 0, titre: 'Maîtrise des informations documentées v1', statut: 'APPLICABLE', date_application: '2024-01-15', date_prochaine_revision: '2026-01-15' },
      { document_id: insertedDocs[1].id, numero_revision: 0, titre: 'Mode opératoire de maintenance v1', statut: 'BROUILLON', date_redaction: '2025-06-01' },
      { document_id: insertedDocs[2].id, numero_revision: 0, titre: 'ISO 9001:2015', statut: 'APPLICABLE', date_application: '2024-03-01', date_prochaine_revision: '2027-03-01' },
      { document_id: insertedDocs[3].id, numero_revision: 0, titre: 'Formulaire évaluation fournisseur v2', statut: 'BROUILLON', date_approbation: '2025-05-10', date_application: '2025-06-01' },
      { document_id: insertedDocs[4].id, numero_revision: 0, titre: 'Procédure recrutement v1', statut: 'BROUILLON', date_redaction: '2025-06-20' },
      { document_id: insertedDocs[0].id, numero_revision: 1, titre: 'Maîtrise des informations documentées v2', statut: 'BROUILLON', date_approbation: '2025-06-18', date_application: '2025-07-01', date_prochaine_revision: '2027-07-01' },
    ];

    const insertedRevisions = [];
    for (const rev of revisions) {
      const res = await client.query(
        `INSERT INTO revision_document (
          document_id, numero_revision, titre, statut,
          date_redaction, date_revue, date_approbation, date_application,
          date_prochaine_revision, motif_modification
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [
          rev.document_id,
          rev.numero_revision,
          rev.titre,
          rev.statut,
          rev.date_redaction || null,
          rev.date_revue || null,
          rev.date_approbation || null,
          rev.date_application || null,
          rev.date_prochaine_revision || null,
          'Données de test',
        ]
      );
      insertedRevisions.push({ id: res.rows[0].id, ...rev });
    }

    const workflowTransitions = [
      { revIdx: 1, newStatut: 'EN_REVUE' },
      { revIdx: 3, newStatut: 'EN_REVUE' },
      { revIdx: 4, newStatut: 'EN_REVUE' },
      { revIdx: 5, newStatut: 'EN_REVUE' },
    ];

    for (const t of workflowTransitions) {
      await client.query(
        `UPDATE revision_document SET statut = $1 WHERE id = $2`,
        [t.newStatut, insertedRevisions[t.revIdx].id]
      );
    }

    const secondTransitions = [
      { revIdx: 3, newStatut: 'APPROUVE' },
      { revIdx: 5, newStatut: 'APPROUVE' },
    ];

    for (const t of secondTransitions) {
      await client.query(
        `UPDATE revision_document SET statut = $1 WHERE id = $2`,
        [t.newStatut, insertedRevisions[t.revIdx].id]
      );
    }

    await client.query('COMMIT');
    console.log('Données de test insérées avec succès.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur insertion données de test :', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

insertSampleData();

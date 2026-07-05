-- Migration: Conformité légale
CREATE TABLE IF NOT EXISTS conformites (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    domaine VARCHAR(50) NOT NULL,
    intitule VARCHAR(255) NOT NULL,
    derniere_evaluation DATE NOT NULL DEFAULT NOW(),
    prochaine_echeance DATE NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'CONFORME',
    checks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conformites_statut ON conformites(statut);
CREATE INDEX IF NOT EXISTS idx_conformites_domaine ON conformites(domaine);

INSERT INTO conformites (reference, domaine, intitule, derniere_evaluation, prochaine_echeance, statut, checks)
VALUES
('REG-001', 'Environnement', 'Gestion des déchets industriels', '2025-01-15', '2025-09-15', 'CONFORME',
 '[{"label":"Décret appliqué","ok":true},{"label":"Registre tenu","ok":true}]'),
('REG-002', 'SST', 'Limites rejets atmosphériques', '2025-03-10', '2025-08-30', 'EVALUATION',
 '[{"label":"Mesures effectuées","ok":true},{"label":"Rapport en cours","ok":false}]'),
('REG-003', 'Qualité', 'Exigences ISO 9001:2015', '2024-12-01', '2025-12-01', 'CONFORME',
 '[{"label":"Audit interne passé","ok":true},{"label":"Actions clôturées","ok":true}]'),
('REG-004', 'Environnement', 'Plan de gestion des eaux usées', '2025-02-20', '2025-07-30', 'NON_CONFORME',
 '[{"label":"Diagnostic réalisé","ok":true},{"label":"Plan d''action validé","ok":false}]');

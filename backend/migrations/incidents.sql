-- Migration: Incidents / accidents du travail
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    gravite VARCHAR(20) NOT NULL,
    zone VARCHAR(255) NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'OUVERT',
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Accident',
    checks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_statut ON incidents(statut);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(type);

INSERT INTO incidents (reference, description, gravite, zone, statut, date, type, checks)
VALUES
('INC-2025-001', 'Chute de hauteur échelle plateforme B', 'TF', 'Plateforme B', 'CLOS', '2025-06-15', 'Accident avec arrêt',
 '[{"label":"Déclaration faite","ok":true},{"label":"Investigation complète","ok":true},{"label":"Actions correctives appliquées","ok":true}]'),
('INC-2025-002', 'Contact avec objet tranchant', 'TFP', 'Atelier', 'CLOS', '2025-06-20', 'Accident sans arrêt',
 '[{"label":"Premiers secours donnés","ok":true},{"label":"Fiche AT remplie","ok":true}]'),
('INC-2025-003', 'Presqu''accident : glissade sol mouillé', 'PA', 'Couloir atelier', 'COURS', '2025-07-01', 'Presqu''accident',
 '[{"label":"Signalement enregistré","ok":true},{"label":"Zone sécurisée","ok":true}]');

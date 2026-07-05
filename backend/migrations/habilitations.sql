-- Migration: Habilitations SST
CREATE TABLE IF NOT EXISTS habilitations (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    competences TEXT[] DEFAULT '{}',
    date_expiration DATE NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'VALIDE',
    checks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habilitations_expiration ON habilitations(date_expiration);
CREATE INDEX IF NOT EXISTS idx_habilitations_statut ON habilitations(statut);

INSERT INTO habilitations (reference, nom, prenom, competences, date_expiration, statut, checks)
VALUES
('HAB-001', 'Kaci', 'Rachid', ARRAY['Habilité électrique HTA','Travaux en hauteur'], '2025-12-15', 'VALIDE',
 '[{"label":"Formation initiale","ok":true},{"label":"Mise à jour SST","ok":true}]'),
('HAB-002', 'Hamza', 'Toufik', ARRAY['Permis de confiné','Sauvetage'], '2025-11-30', 'A_RENOUVELER',
 '[{"label":"Formation initiale","ok":true},{"label":"Mise à jour SST","ok":false}]'),
('HAB-003', 'Aissaoui', 'Farid', ARRAY['Feu chaud'], '2025-10-20', 'EXPIRE',
 '[{"label":"Formation initiale","ok":true},{"label":"Mise à jour SST","ok":false}]');

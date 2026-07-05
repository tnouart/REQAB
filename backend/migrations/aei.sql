-- Migration: Aspects environnementaux / impacts (AEI)
CREATE TABLE IF NOT EXISTS aspects_environnementaux (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    activite VARCHAR(255) NOT NULL,
    aspect VARCHAR(255) NOT NULL,
    impact VARCHAR(255) NOT NULL,
    condition VARCHAR(100) NOT NULL,
    criticite INTEGER NOT NULL CHECK (criticite BETWEEN 1 AND 5),
    significatif BOOLEAN NOT NULL DEFAULT true,
    processus VARCHAR(100) NOT NULL DEFAULT 'General',
    checks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aie_processus ON aspects_environnementaux(processus);
CREATE INDEX IF NOT EXISTS idx_aie_significatif ON aspects_environnementaux(significatif);

INSERT INTO aspects_environnementaux (reference, activite, aspect, impact, condition, criticite, significatif, processus, checks)
VALUES
('AEI-001', 'Forage puits P-14', 'Rejet d''hydrocarbures', 'Contamination sol/eau', 'Situation d''urgence', 5, true, 'Forage',
 '[{"label":"Bassin de rétention opérationnel","ok":true},{"label":"Plan d''urgence déversement testé","ok":true}]'),
('AEI-002', 'Générateur électrique', 'Consommation eau', 'Stress hydrique', 'Situation normale', 3, true, 'Production',
 '[{"label":"Compteur d''eau installé","ok":true},{"label":"Procédure recyclage eaux de forage appliquée","ok":true}]'),
('AEI-003', 'Centrales bitume', 'Émissions CO₂', 'Chang. climatique', 'Situation normale', 4, true, 'Production',
 '[{"label":"Rapport GES mis à jour","ok":true},{"label":"Plan de réduction approuvé","ok":false}]'),
('AEI-004', 'Atelier maintenance', 'Bruit', 'Troubles voisinage', 'Situation normale', 2, false, 'Maintenance',
 '[{"label":"Écrans acoustiques installés","ok":true}]'),
('AEI-005', 'Stockage produits chimiques', 'Fuite produit chimique', 'Pollution sol/eau', 'Situation d''urgence', 5, true, 'Stockage',
 '[{"label":"Aire de rétention dimensionnée","ok":true},{"label":"Fiches de sécurité à jour","ok":true}]');

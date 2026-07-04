-- Migration: Permis de travail (PTW)
CREATE TABLE IF NOT EXISTS permis_travail (
    id SERIAL PRIMARY KEY,
    numero_ptw VARCHAR(50) UNIQUE NOT NULL,
    type_travail VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    zone VARCHAR(255) NOT NULL,
    description TEXT,
    responsable VARCHAR(255) NOT NULL,
    date_debut TIMESTAMP NOT NULL,
    date_fin TIMESTAMP NOT NULL,
    urgence VARCHAR(20) NOT NULL DEFAULT 'norm',
    statut VARCHAR(20) NOT NULL DEFAULT 'ATTENTE',
    risques JSONB DEFAULT '[]'::jsonb,
    epi JSONB DEFAULT '[]'::jsonb,
    checks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ptw_statut ON permis_travail(statut);
CREATE INDEX IF NOT EXISTS idx_ptw_type ON permis_travail(type_travail);

INSERT INTO permis_travail (numero_ptw, type_travail, titre, zone, description, responsable, date_debut, date_fin, urgence, statut, risques, epi, checks)
VALUES
('PTW-2025-042', 'chaud', 'Soudure bride puits P-14', 'Zone forage P-14', 'Soudure sur bride puits P-14', 'T. Hamza', '2025-07-07 08:00:00', '2025-07-07 16:00:00', 'haute', 'ACTIF',
 '["Incendie / explosion gaz","Brûlures thermiques","Inhalation fumées"]',
 '["Écran facial","Gants cuir","Vêtements ignifuges","Détecteur gaz H₂S"]',
 '[{"label":"Zone délimitée et balisée","ok":true},{"label":"Extinction incendie positionnée","ok":true},{"label":"Analyse atmosphérique effectuée","ok":true},{"label":"Consignation équipements validée","ok":false},{"label":"Communication urgence testée","ok":false}]'),
('PTW-2025-041', 'electr', 'Remplacement disjoncteur tableau électrique', 'Atelier maintenance', 'Remplacement disjoncteur', 'R. Kaci', '2025-07-07 14:00:00', '2025-07-07 18:00:00', 'moy', 'APPROUVE',
 '["Électrocution","Arcs électriques","Blessures mains"]',
 '["Gants isolants classe 4","Écran facial","EPI isolant HTA"]',
 '[{"label":"Consignation LOTO effectuée","ok":true},{"label":"VAT vérification absence tension","ok":true},{"label":"Zone de travail isolée","ok":false},{"label":"Habilitation électrique vérifiée","ok":false}]'),
('PTW-2025-040', 'confine', 'Nettoyage intérieur citerne T-07', 'Zone stockage', 'Nettoyage intérieur citerne', 'F. Aissaoui', '2025-07-08 07:00:00', '2025-07-08 12:00:00', 'haute', 'ATTENTE',
 '["Asphyxie O₂ déficient","Intoxication vapeurs","Explosion vapeurs"]',
 '["ARI (air comprimé)","Harnais sécurité","Trépied évacuation"]',
 '[{"label":"Analyse O₂ ≥ 19,5%","ok":false},{"label":"LEL < 10% vérifié","ok":false},{"label":"Surveillant de surface désigné","ok":false},{"label":"Moyen de récupération opérationnel","ok":false}]'),
('PTW-2025-039', 'hauteur', 'Inspection toiture bâtiment administratif', 'Bâtiment admin', 'Inspection toiture', 'T. Hamza', '2025-07-05 09:00:00', '2025-07-05 11:00:00', 'norm', 'CLOS',
 '["Chute de hauteur","Chute d''objets"]',
 '["Harnais antichute","Casque","Chaussures de sécurité"]',
 '[{"label":"Point d''ancrage vérifié","ok":true},{"label":"Filet de sécurité installé","ok":true},{"label":"Zone de travail balisée","ok":true}]'),
('PTW-2025-038', 'chaud', 'Soudure canalisation gaz naturel', 'Zone production', 'Soudure canalisation gaz', 'R. Kaci', '2025-07-09 08:00:00', '2025-07-09 14:00:00', 'moy', 'ATTENTE',
 '["Incendie/explosion","Brûlures","Projection matière fondue"]',
 '["Masque soudage","Gants cuir","Tablier protection"]',
 '[{"label":"Purge canalisation validée","ok":false},{"label":"Permis d''atmosphère explosible","ok":false}]'),
('PTW-2025-037', 'electr', 'Test protection relais différentiel', 'Salle électrique HTA', 'Test relais', 'T. Hamza', '2025-07-08 09:00:00', '2025-07-08 12:00:00', 'norm', 'APPROUVE',
 '["Électrocution HTA","Arc électrique"]',
 '["EPI HTA complet","Écran facial classe 2"]',
 '[{"label":"Consignation validée responsable","ok":true},{"label":"Procédure de test approuvée","ok":true}]'),
('PTW-2025-036', 'chaud', 'Réparation chaudière production vapeur', 'Zone production', 'Réparation chaudière', 'F. Aissaoui', '2025-07-04 07:00:00', '2025-07-04 17:00:00', 'haute', 'CLOS',
 '["Brûlures vapeur haute pression","Incendie"]',
 '["Combinaison anti-brûlure","Gants isolants"]',
 '[{"label":"Purge vapeur complète","ok":true},{"label":"Refroidissement confirmé","ok":true},{"label":"Zone interdite balisée","ok":true}]');

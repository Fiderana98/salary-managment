-- ============================================================
-- Migration 004: seed_test_data
-- Date: 2026-06-14
-- Description: Insertion des données de test
--              (départements, employés en @gmail.com, primes)
-- ============================================================

-- ## UP

-- ─── Départements ────────────────────────────────────────────
INSERT IGNORE INTO departements (id, nom, responsable, budget) VALUES
('d1', 'Direction Générale', 'RAKOTO Jean', 15000000),
('d2', 'Ressources Humaines', 'RASOAMANARIVO Hanta', 8000000),
('d3', 'Comptabilité & Finance', 'RANDRIA Paul', 10000000),
('d4', 'Informatique', 'RABEMANANJARA Luc', 12000000),
('d5', 'Commercial & Marketing', 'RAZAFY Marie', 9000000),
('d6', 'Production', 'RAMANANTSOA Eric', 20000000),
('d7', 'Logistique', 'ANDRIANTSOA Zo', 7000000),
('d8', 'Juridique', 'RANAIVO Sophie', 5000000);

-- ─── Employés (tous en @gmail.com) ──────────────────────────
INSERT IGNORE INTO employes (id, matricule, nom, prenom, sexe, date_naissance, date_embauche, poste, departement_id, secteur, categorie, statut, salaire_brut, email, telephone, adresse, nombre_enfants, rib) VALUES
('e001', 'EMP-001', 'RAKOTO', 'Jean Pierre', 'M', '1975-03-15', '2010-01-10', 'Directeur Général', 'd1', 'non_agricole', 'M8', 'actif', 4500000, 'j.rakoto@gmail.com', '+261 34 12 345 67', 'Antananarivo, Ankadifotsy', 3, 'BNI00000001'),
('e002', 'EMP-002', 'RASOAMANARIVO', 'Hanta', 'F', '1980-07-22', '2012-03-01', 'DRH', 'd2', 'non_agricole', 'M7', 'actif', 2800000, 'h.rasoamanarivo@gmail.com', '+261 33 98 765 43', 'Antananarivo, Behoririka', 2, 'BNI00000002'),
('e003', 'EMP-003', 'RANDRIA', 'Paul', 'M', '1978-11-08', '2011-06-15', 'Directeur Financier', 'd3', 'non_agricole', 'M7', 'actif', 2600000, 'p.randria@gmail.com', '+261 32 11 223 44', 'Antananarivo, Tsaralalana', 4, 'BOA00000003'),
('e004', 'EMP-004', 'RABEMANANJARA', 'Luc', 'M', '1985-05-30', '2015-09-01', 'Responsable IT', 'd4', 'non_agricole', 'M6', 'actif', 1800000, 'l.rabemananjara@gmail.com', '+261 34 55 667 88', 'Antananarivo, Mahamasina', 1, 'MCB00000004'),
('e005', 'EMP-005', 'RAZAFY', 'Marie Claire', 'F', '1988-02-14', '2016-04-01', 'Responsable Marketing', 'd5', 'non_agricole', 'M6', 'actif', 1650000, 'm.razafy@gmail.com', '+261 33 44 556 77', 'Antananarivo, Analakely', 0, 'BNI00000005'),
('e006', 'EMP-006', 'RAMANANTSOA', 'Eric', 'M', '1972-09-03', '2008-02-01', 'Chef de Production', 'd6', 'non_agricole', 'M6', 'actif', 1500000, 'e.ramanantsoa@gmail.com', '+261 32 77 889 00', 'Antananarivo, Andohatapenaka', 5, 'BOA00000006'),
('e007', 'EMP-007', 'ANDRIANTSOA', 'Zo', 'M', '1990-12-25', '2018-07-15', 'Responsable Logistique', 'd7', 'non_agricole', 'M5', 'actif', 1200000, 'z.andriantsoa@gmail.com', '+261 34 33 445 66', 'Antananarivo, Itaosy', 2, 'MCB00000007'),
('e008', 'EMP-008', 'RANAIVO', 'Sophie', 'F', '1983-06-17', '2014-01-05', 'Juriste', 'd8', 'non_agricole', 'M6', 'actif', 1700000, 's.ranaivo@gmail.com', '+261 33 66 778 99', 'Antananarivo, Ampefiloha', 1, 'BNI00000008'),
('e009', 'EMP-009', 'RAJAONARISON', 'Thierry', 'M', '1992-04-08', '2019-10-01', 'Développeur Senior', 'd4', 'non_agricole', 'M5', 'actif', 1100000, 't.rajaonarison@gmail.com', '+261 32 22 334 55', 'Antananarivo, 67Ha', 0, 'BOA00000009'),
('e010', 'EMP-010', 'ANDRIANJAFY', 'Noro', 'F', '1995-08-20', '2020-03-15', 'Comptable', 'd3', 'non_agricole', 'M4', 'actif', 800000, 'n.andrianjafy@gmail.com', '+261 34 88 990 11', 'Antananarivo, Ambohijatovo', 0, 'MCB00000010'),
('e011', 'EMP-011', 'RAKOTONIRINA', 'Fidy', 'M', '1987-01-11', '2013-05-20', 'Ingénieur Production', 'd6', 'non_agricole', 'M5', 'actif', 1050000, 'f.rakotonirina@gmail.com', '+261 33 11 223 34', 'Antananarivo, Ivandry', 3, 'BNI00000011'),
('e012', 'EMP-012', 'RASOANANDRASANA', 'Lalaina', 'F', '1993-10-05', '2021-02-01', 'Chargée RH', 'd2', 'non_agricole', 'M4', 'actif', 750000, 'l.rasoanandrasana@gmail.com', '+261 32 55 667 78', 'Antananarivo, Ankorondrano', 1, 'BOA00000012'),
('e013', 'EMP-013', 'RAVOAVY', 'Nirina', 'M', '1991-03-27', '2017-11-10', 'Commercial', 'd5', 'non_agricole', 'M4', 'actif', 720000, 'n.ravoavy@gmail.com', '+261 34 99 001 12', 'Antananarivo, Ambanidia', 2, 'MCB00000013'),
('e014', 'EMP-014', 'RAZANAJATOVO', 'Anja', 'F', '1996-07-14', '2022-01-10', 'Assistante Administrative', 'd1', 'non_agricole', 'M3', 'actif', 550000, 'a.razanajatovo@gmail.com', '+261 33 22 334 45', 'Antananarivo, Ambohibao', 0, 'BNI00000014'),
('e015', 'EMP-015', 'RANDRIANTSARA', 'Mamy', 'M', '1989-09-09', '2016-08-22', 'Technicien IT', 'd4', 'non_agricole', 'M4', 'actif', 700000, 'm.randriantsara@gmail.com', '+261 32 44 556 67', 'Antananarivo, Andranomahery', 1, 'BOA00000015'),
('e016', 'EMP-016', 'ANDRIAMANANA', 'Volatiana', 'F', '1994-12-01', '2020-09-07', 'Designer Graphique', 'd5', 'non_agricole', 'M4', 'actif', 680000, 'v.andriamanana@gmail.com', '+261 34 77 889 00', 'Antananarivo, Antanimena', 0, 'MCB00000016'),
('e017', 'EMP-017', 'RAKOTOVAO', 'Hanitra', 'F', '1982-05-18', '2009-12-01', 'Chef Comptable', 'd3', 'non_agricole', 'M6', 'actif', 1450000, 'h.rakotovao@gmail.com', '+261 33 88 990 01', 'Antananarivo, Alarobia', 2, 'BNI00000017'),
('e018', 'EMP-018', 'RAHARISON', 'Cyril', 'M', '1990-02-14', '2018-04-03', 'Superviseur Production', 'd6', 'non_agricole', 'M5', 'conge', 980000, 'c.raharison@gmail.com', '+261 32 33 445 56', 'Antananarivo, Ambohidratrimo', 3, 'BOA00000018'),
('e019', 'EMP-019', 'RATSIMBA', 'Francine', 'F', '1997-06-30', '2022-06-01', 'Assistante Commerciale', 'd5', 'non_agricole', 'M3', 'actif', 500000, 'f.ratsimba@gmail.com', '+261 34 11 223 34', 'Antananarivo, Ankadimbahoaka', 0, 'MCB00000019'),
('e020', 'EMP-020', 'ANDRIAMIANDRISOA', 'Patrick', 'M', '1986-11-22', '2014-07-14', 'Responsable Qualité', 'd6', 'non_agricole', 'M5', 'actif', 1100000, 'p.andriamiandrisoa@gmail.com', '+261 33 55 667 78', 'Antananarivo, Tanjombato', 4, 'BNI00000020'),
('e021', 'EMP-021', 'RAMAROSON', 'Tahina', 'M', '1993-08-07', '2019-01-15', 'Développeur Junior', 'd4', 'non_agricole', 'M3', 'actif', 620000, 't.ramaroson@gmail.com', '+261 32 66 778 89', 'Antananarivo, Soarano', 0, 'BOA00000021'),
('e022', 'EMP-022', 'RAKOTOMALALA', 'Voahangy', 'F', '1985-04-12', '2011-10-01', 'Responsable Juridique', 'd8', 'non_agricole', 'M6', 'actif', 1600000, 'v.rakotomalala@gmail.com', '+261 34 22 334 45', 'Antananarivo, Antsahabe', 2, 'MCB00000022'),
('e023', 'EMP-023', 'RAHARIMANANA', 'Dina', 'F', '1991-01-25', '2017-03-20', 'Gestionnaire Stock', 'd7', 'non_agricole', 'M4', 'actif', 670000, 'd.raharimanana@gmail.com', '+261 33 77 889 00', 'Antananarivo, Andoharanofotsy', 1, 'BNI00000023'),
('e024', 'EMP-024', 'ANDRIANARIMANANA', 'Rija', 'M', '1998-10-03', '2023-02-13', 'Stagiaire IT', 'd4', 'non_agricole', 'M1', 'actif', 300000, 'r.andrianarimanana@gmail.com', '+261 32 88 990 01', 'Antananarivo, Ambohipo', 0, 'BOA00000024'),
('e025', 'EMP-025', 'RAJOELINA', 'Miora', 'F', '1994-05-28', '2021-08-01', 'Comptable Junior', 'd3', 'non_agricole', 'M3', 'actif', 530000, 'm.rajoelina@gmail.com', '+261 34 44 556 67', 'Antananarivo, Ambohimanambola', 0, 'MCB00000025'),
('e026', 'EMP-026', 'RATSIMANDRESY', 'Herisoa', 'M', '1979-07-16', '2007-11-01', 'Chef Logistique', 'd7', 'non_agricole', 'M5', 'actif', 1080000, 'h.ratsimandresy@gmail.com', '+261 33 99 001 12', 'Antananarivo, Anosizato', 4, 'BNI00000026'),
('e027', 'EMP-027', 'ANDRIANIVO', 'Tantely', 'F', '1992-03-11', '2018-12-03', 'Chargée Communication', 'd5', 'non_agricole', 'M4', 'actif', 740000, 't.andrianivo@gmail.com', '+261 32 11 223 34', 'Antananarivo, Ambohibehoina', 1, 'BOA00000027'),
('e028', 'EMP-028', 'RAKOTOBE', 'Hery', 'M', '1984-09-19', '2012-07-10', 'Ingénieur Qualité', 'd6', 'non_agricole', 'M5', 'conge', 1020000, 'h.rakotobe@gmail.com', '+261 34 55 667 78', 'Antananarivo, Ambohitrimanjaka', 2, 'MCB00000028'),
('e029', 'EMP-029', 'RALAINDIMBY', 'Sahondra', 'F', '1988-12-04', '2015-02-28', 'Juriste Senior', 'd8', 'non_agricole', 'M5', 'actif', 1150000, 's.ralaindimby@gmail.com', '+261 33 33 445 56', 'Antananarivo, Ampahibe', 0, 'BNI00000029'),
('e030', 'EMP-030', 'ANDRIAMAMPIONONA', 'Lanto', 'M', '1996-04-22', '2022-09-01', 'Agent Commercial', 'd5', 'non_agricole', 'M2', 'actif', 400000, 'l.andriamampionona@gmail.com', '+261 32 77 889 00', 'Antananarivo, Soanierana', 0, 'BOA00000030');

-- ─── Admin email update ──────────────────────────────────────
UPDATE utilisateurs SET email = 'admin@gmail.com' WHERE email = 'admin@gmail.com';

-- ─── Primes de test ──────────────────────────────────────────
INSERT IGNORE INTO primes (id, libelle, type, cible, employe_id, departement_id, mode, valeur, imposable, actif, date_debut, date_fin, description) VALUES
('p001', 'Prime du meilleur employé', 'ciblee', 'personne', 'e001', NULL, 'fixe', 500000, 1, 1, '2026-01-01', NULL, 'Prime exceptionnelle pour le meilleur employé du mois'),
('p002', 'Prime performance IT', 'ciblee', 'departement', NULL, 'd4', 'taux', 10, 1, 1, '2026-01-01', '2026-12-31', 'Bonus de performance pour le département IT : 10% du brut'),
('p003', 'Prime de fin d\'année', 'ciblee', 'tous', NULL, NULL, 'fixe', 200000, 1, 1, '2026-12-01', '2026-12-31', 'Prime de fin d\'année pour tous les employés'),
('p004', 'Prime d\'ancienneté', 'automatique', NULL, NULL, NULL, 'taux', 1, 1, 1, '2026-01-01', NULL, 'Prime d\'ancienneté automatique : 1% par année d\'ancienneté'),
('p005', 'Bonus transport', 'ciblee', 'personne', 'e010', NULL, 'fixe', 50000, 0, 1, '2026-03-01', NULL, 'Indemnité transport pour le comptable (exonérée)'),
('p006', 'Prime productivité Production', 'ciblee', 'departement', NULL, 'd6', 'taux', 5, 1, 1, '2026-02-01', '2026-06-30', 'Prime de productivité pour la production'),
('p007', 'Bonus challenge commercial', 'ciblee', 'tous', NULL, NULL, 'fixe', 100000, 1, 0, '2026-01-01', '2026-03-31', 'Ancien bonus commercial (désactivé)'),
('p008', 'Prime de risque', 'automatique', NULL, NULL, NULL, 'fixe', 75000, 1, 1, '2026-01-01', NULL, 'Prime automatique de risque pour tous les employés de production');

-- ## DOWN
DELETE FROM primes;
DELETE FROM employes WHERE id LIKE 'e%';
DELETE FROM departements WHERE id LIKE 'd%';
UPDATE utilisateurs SET email = 'admin@gmail.com' WHERE email = 'admin@gmail.com';
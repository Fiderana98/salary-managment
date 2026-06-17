-- ============================================================
-- Migration 003: add_primes_table
-- Date: 2025-06-14
-- ============================================================

-- ## UP
CREATE TABLE IF NOT EXISTS primes (
  id              VARCHAR(36)   PRIMARY KEY,
  libelle         VARCHAR(200)  NOT NULL,
  type            ENUM('ciblee', 'automatique') NOT NULL DEFAULT 'ciblee',
  cible           ENUM('personne', 'departement', 'tous') DEFAULT NULL,
  employe_id      VARCHAR(36)   DEFAULT NULL,
  departement_id  VARCHAR(36)   DEFAULT NULL,
  mode            ENUM('taux', 'fixe') NOT NULL DEFAULT 'fixe',
  valeur          DECIMAL(12,2) NOT NULL DEFAULT 0,
  actif           TINYINT(1)    NOT NULL DEFAULT 1,
  date_debut      DATE          NOT NULL,
  date_fin        DATE          DEFAULT NULL,
  description     TEXT,
  cree_le         DATETIME      NOT NULL DEFAULT NOW(),
  modifie_le      DATETIME      NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE,
  FOREIGN KEY (departement_id) REFERENCES departements(id) ON DELETE CASCADE
);

-- ## DOWN
DROP TABLE IF EXISTS primes;
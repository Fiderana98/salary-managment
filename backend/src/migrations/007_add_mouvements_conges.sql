-- ============================================================
-- Migration 007: add_mouvements_conges
-- Date: 2026-06-15
-- Description: Tables pour les mouvements (suspension, 
--              licenciement, départ retraite, démission) 
--              et gestion des congés
-- ============================================================

-- ## UP

CREATE TABLE IF NOT EXISTS employe_mouvements (
  id              VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  employe_id      VARCHAR(36)   NOT NULL,
  type            ENUM('suspension', 'licenciement', 'depart_retraite', 'demission') NOT NULL,
  motif           TEXT          NOT NULL,
  date_debut      DATE          NOT NULL,
  date_fin        DATE          DEFAULT NULL,
  indemnite       DECIMAL(15,2) DEFAULT 0,
  pourcentage_remuneration DECIMAL(5,2) DEFAULT NULL,
  actif           TINYINT(1)    NOT NULL DEFAULT 1,
  cree_le         DATETIME      NOT NULL DEFAULT NOW(),
  modifie_le      DATETIME      NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employe_conges (
  id              VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  employe_id      VARCHAR(36)   NOT NULL,
  libelle         VARCHAR(200)  NOT NULL,
  motif           TEXT,
  date_debut      DATE          NOT NULL,
  date_fin        DATE          NOT NULL,
  pourcentage_remuneration DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  actif           TINYINT(1)    NOT NULL DEFAULT 1,
  cree_le         DATETIME      NOT NULL DEFAULT NOW(),
  modifie_le      DATETIME      NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
);

CREATE INDEX idx_mouvements_employe ON employe_mouvements(employe_id);
CREATE INDEX idx_mouvements_actif   ON employe_mouvements(actif);
CREATE INDEX idx_mouvements_type    ON employe_mouvements(type);
CREATE INDEX idx_conges_employe     ON employe_conges(employe_id);
CREATE INDEX idx_conges_actif       ON employe_conges(actif);

-- ## DOWN

DROP TABLE IF EXISTS employe_conges;
DROP TABLE IF EXISTS employe_mouvements;
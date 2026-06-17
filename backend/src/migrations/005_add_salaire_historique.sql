-- ============================================================
-- Historique des changements de salaire (augmentation,
-- promotion, rétrogradation)
-- ============================================================

CREATE TABLE IF NOT EXISTS historique_salaires (
  id              VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  employe_id      VARCHAR(36)   NOT NULL,
  type_changement ENUM('augmentation', 'promotion', 'retrogradation') NOT NULL,
  ancien_salaire  DECIMAL(12,2) NOT NULL,
  nouveau_salaire DECIMAL(12,2) NOT NULL,
  ancien_poste    VARCHAR(150)  DEFAULT NULL,
  nouveau_poste   VARCHAR(150)  DEFAULT NULL,
  motif           TEXT          DEFAULT NULL,
  periode_effet   VARCHAR(7)    NOT NULL,  -- ex: "2024-06"
  cree_le         DATETIME      NOT NULL DEFAULT NOW(),
  FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
);

CREATE INDEX idx_histo_salaire_employe ON historique_salaires(employe_id);
CREATE INDEX idx_histo_salaire_periode ON historique_salaires(periode_effet);
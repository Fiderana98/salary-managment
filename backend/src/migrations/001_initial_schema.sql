-- ============================================================
-- Migration 001: initial_schema
-- Date: 2026-06-14
-- Description: Schéma initial de la base gestion_salaire
--              (tables, index, contraintes)
-- ============================================================

-- ## UP

-- ─── Utilisateurs (authentification) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS utilisateurs (
  id          VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  nom         VARCHAR(100)  NOT NULL,
  prenom      VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  role        ENUM('admin', 'rh', 'comptable', 'lecture') NOT NULL DEFAULT 'lecture',
  actif       TINYINT(1)    NOT NULL DEFAULT 1,
  derniere_connexion DATETIME,
  cree_le     DATETIME      NOT NULL DEFAULT NOW(),
  modifie_le  DATETIME      NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

-- ─── Paramètres de paie ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parametres_paie (
  id                        INT           PRIMARY KEY AUTO_INCREMENT,
  sme_non_agricole          DECIMAL(12,2) NOT NULL DEFAULT 262680,
  sme_agricole              DECIMAL(12,2) NOT NULL DEFAULT 266500,
  plafond_multiplier        INT           NOT NULL DEFAULT 8,
  cnaps_salarial            DECIMAL(5,4)  NOT NULL DEFAULT 0.0100,
  cnaps_patronal            DECIMAL(5,4)  NOT NULL DEFAULT 0.1300,
  ostie_salariale           DECIMAL(5,4)  NOT NULL DEFAULT 0.0100,
  ostie_patronale           DECIMAL(5,4)  NOT NULL DEFAULT 0.0500,
  fmfp_patronal             DECIMAL(5,4)  NOT NULL DEFAULT 0.0100,
  heures_travail_mensuel    DECIMAL(6,2)  NOT NULL DEFAULT 173.33,
  taux_heure_supplementaire DECIMAL(5,4)  NOT NULL DEFAULT 1.3000,
  prime_anciennete_taux     DECIMAL(5,4)  NOT NULL DEFAULT 0.0100,
  prime_transport_defaut    DECIMAL(12,2) NOT NULL DEFAULT 30000,
  cree_le                   DATETIME      NOT NULL DEFAULT NOW(),
  modifie_le                DATETIME      NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

-- ─── Tranches IRSA ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tranches_irsa (
  id                  INT           PRIMARY KEY AUTO_INCREMENT,
  parametres_paie_id  INT           NOT NULL,
  rang                INT           NOT NULL,
  montant_min         DECIMAL(12,2) NOT NULL,
  montant_max         DECIMAL(12,2),
  taux                DECIMAL(5,4)  NOT NULL,
  FOREIGN KEY (parametres_paie_id) REFERENCES parametres_paie(id) ON DELETE CASCADE
);

-- ─── Départements ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departements (
  id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  nom           VARCHAR(100)  NOT NULL UNIQUE,
  responsable   VARCHAR(200),
  budget        DECIMAL(15,2),
  cree_le       DATETIME      NOT NULL DEFAULT NOW(),
  modifie_le    DATETIME      NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

-- ─── Employés ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employes (
  id                VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  matricule         VARCHAR(20)   NOT NULL UNIQUE,
  nom               VARCHAR(100)  NOT NULL,
  prenom            VARCHAR(100)  NOT NULL,
  sexe              ENUM('M', 'F') NOT NULL,
  date_naissance    DATE,
  date_embauche     DATE          NOT NULL,
  poste             VARCHAR(150)  NOT NULL,
  departement_id    VARCHAR(36)   NOT NULL,
  secteur           ENUM('non_agricole', 'agricole') NOT NULL DEFAULT 'non_agricole',
  categorie         ENUM('M1','M2','M3','M4','M5','M6','M7','M8') NOT NULL DEFAULT 'M1',
  statut            ENUM('actif', 'conge', 'suspendu', 'depart') NOT NULL DEFAULT 'actif',
  salaire_brut      DECIMAL(12,2) NOT NULL,
  email             VARCHAR(150),
  telephone         VARCHAR(30),
  adresse           TEXT,
  nombre_enfants    INT           NOT NULL DEFAULT 0,
  rib               VARCHAR(50),
  cree_le           DATETIME      NOT NULL DEFAULT NOW(),
  modifie_le        DATETIME      NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (departement_id) REFERENCES departements(id)
);

-- ─── Bulletins de paie ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bulletins_paie (
  id                            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  employe_id                    VARCHAR(36)   NOT NULL,
  periode                       VARCHAR(7)    NOT NULL,
  salaire_brut                  DECIMAL(12,2) NOT NULL,
  heures_supplementaires        DECIMAL(6,2)  NOT NULL DEFAULT 0,
  montant_heures_sup            DECIMAL(12,2) NOT NULL DEFAULT 0,
  prime_transport               DECIMAL(12,2) NOT NULL DEFAULT 0,
  prime_anciennete              DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_brut                    DECIMAL(12,2) NOT NULL,
  cnaps_salarial                DECIMAL(12,2) NOT NULL,
  ostie_salariale               DECIMAL(12,2) NOT NULL,
  total_cotisations_salariales  DECIMAL(12,2) NOT NULL,
  irsa                          DECIMAL(12,2) NOT NULL DEFAULT 0,
  salaire_net                   DECIMAL(12,2) NOT NULL,
  cnaps_patronal                DECIMAL(12,2) NOT NULL,
  ostie_patronale               DECIMAL(12,2) NOT NULL,
  fmfp_patronal                 DECIMAL(12,2) NOT NULL,
  total_charges_patronales      DECIMAL(12,2) NOT NULL,
  cout_total_employeur          DECIMAL(12,2) NOT NULL,
  statut                        ENUM('brouillon', 'valide', 'paye') NOT NULL DEFAULT 'brouillon',
  date_validation               DATETIME,
  date_paiement                 DATETIME,
  cree_le                       DATETIME      NOT NULL DEFAULT NOW(),
  modifie_le                    DATETIME      NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  UNIQUE KEY uk_bulletin (employe_id, periode),
  FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE RESTRICT
);

-- ─── Primes additionnelles (lignes bulletin) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS bulletin_primes (
  id              INT           PRIMARY KEY AUTO_INCREMENT,
  bulletin_id     VARCHAR(36)   NOT NULL,
  libelle         VARCHAR(150)  NOT NULL,
  montant         DECIMAL(12,2) NOT NULL,
  imposable       TINYINT(1)    NOT NULL DEFAULT 1,
  FOREIGN KEY (bulletin_id) REFERENCES bulletins_paie(id) ON DELETE CASCADE
);

-- ─── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  type        ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
  titre       VARCHAR(200)  NOT NULL,
  message     TEXT          NOT NULL,
  lu          TINYINT(1)    NOT NULL DEFAULT 0,
  cree_le     DATETIME      NOT NULL DEFAULT NOW()
);

-- ─── Gestion des Primes (Bonus) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS primes (
  id              VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
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

-- ─── Index de performance ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_employes_statut     ON employes(statut);
CREATE INDEX IF NOT EXISTS idx_employes_dept       ON employes(departement_id);
CREATE INDEX IF NOT EXISTS idx_bulletins_periode   ON bulletins_paie(periode);
CREATE INDEX IF NOT EXISTS idx_bulletins_statut    ON bulletins_paie(statut);
CREATE INDEX IF NOT EXISTS idx_bulletins_employe   ON bulletins_paie(employe_id);
CREATE INDEX IF NOT EXISTS idx_primes_type         ON primes(type);
CREATE INDEX IF NOT EXISTS idx_primes_employe      ON primes(employe_id);
CREATE INDEX IF NOT EXISTS idx_primes_departement  ON primes(departement_id);
CREATE INDEX IF NOT EXISTS idx_primes_actif        ON primes(actif);

-- ## DOWN

DROP TABLE IF EXISTS primes;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS bulletin_primes;
DROP TABLE IF EXISTS bulletins_paie;
DROP TABLE IF EXISTS employes;
DROP TABLE IF EXISTS departements;
DROP TABLE IF EXISTS tranches_irsa;
DROP TABLE IF EXISTS parametres_paie;
DROP TABLE IF EXISTS utilisateurs;
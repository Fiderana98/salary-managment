-- ============================================================
-- Migration 006: add_imposable_to_primes
-- Date: 2026-06-15
-- Description: Ajoute la colonne imposable à la table primes
-- ============================================================

-- ## UP
ALTER TABLE primes
  ADD COLUMN imposable TINYINT(1) NOT NULL DEFAULT 1
  AFTER valeur;

-- ## DOWN
ALTER TABLE primes DROP COLUMN imposable;
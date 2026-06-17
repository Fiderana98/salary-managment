-- ============================================================
-- Migration 002: seed_admin_user
-- Date: 2026-06-14
-- Description: Insertion de l'utilisateur admin de test
--              Email: admin@gmail.com / Mot de passe: admin123
-- ============================================================

-- ## UP

INSERT INTO utilisateurs (id, nom, prenom, email, mot_de_passe, role, actif)
VALUES (
  UUID(),
  'Admin',
  'Système',
  'admin@gmail.com',
  '$2a$10$ixby1gXhqUUAXgotmWiOXuqtqsvjiZiRW4UwWUFaegf.lRWcJuhqm',
  'admin',
  1
);

-- ## DOWN

DELETE FROM utilisateurs WHERE email = 'admin@gmail.com';
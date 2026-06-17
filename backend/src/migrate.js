/**
 * ============================================================
 *  GESTION SALAIRE — Système de Migrations MySQL
 * ============================================================
 *
 *  Usage :
 *    node src/migrate.js up        → Applique toutes les migrations en attente
 *    node src/migrate.js down      → Annule la dernière migration appliquée
 *    node src/migrate.js down --all → Annule toutes les migrations
 *    node src/migrate.js status    → Affiche l'état des migrations
 *    node src/migrate.js create <name> → Crée un nouveau fichier de migration
 *
 *  Les migrations sont des fichiers .sql dans src/migrations/
 *  numérotés en ordre croissant (001_, 002_, …).
 *
 *  Chaque fichier peut contenir :
 *    -- ## UP
 *    <SQL de migration>
 *    -- ## DOWN
 *    <SQL d'annulation>
 *
 *  Si les sections UP / DOWN sont absentes, tout le fichier est
 *  considéré comme « UP » et on génère un rollback vide (warning).
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ─── Helpers ────────────────────────────────────────────────

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return [];
  }
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

function parseMigrationFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const upMarker = '-- ## UP';
  const downMarker = '-- ## DOWN';

  const upIdx = content.indexOf(upMarker);
  const downIdx = content.indexOf(downMarker);

  if (upIdx !== -1 && downIdx !== -1) {
    return {
      up: content.substring(upIdx + upMarker.length, downIdx).trim(),
      down: content.substring(downIdx + downMarker.length).trim(),
    };
  }

  // Pas de markers → tout le fichier est UP
  return {
    up: content.trim(),
    down: '',
  };
}

function getVersionFromFilename(filename) {
  // Ex: "001_initial_schema.sql" → "001"
  const match = filename.match(/^(\d+)_/);
  return match ? match[1] : null;
}

function getDisplayName(filename) {
  return filename.replace('.sql', '');
}

// ─── Database ───────────────────────────────────────────────

async function getConnection() {
  // D'abord, se connecter sans base de données pour la créer si nécessaire
  const tempConn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  const dbName = process.env.DB_NAME || 'gestion_salaire';
  await tempConn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await tempConn.end();

  // Ensuite, se connecter à la base de données
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
    multipleStatements: true,
  });
  return conn;
}

async function ensureMigrationsTable(conn) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version       VARCHAR(10)  PRIMARY KEY,
      name          VARCHAR(255) NOT NULL,
      applied_at    DATETIME     NOT NULL DEFAULT NOW()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function getAppliedMigrations(conn) {
  const [rows] = await conn.execute(
    'SELECT version, name, applied_at FROM schema_migrations ORDER BY version'
  );
  return rows;
}

// ─── Commands ───────────────────────────────────────────────

async function cmdUp() {
  const conn = await getConnection();
  try {
    await ensureMigrationsTable(conn);
    const applied = await getAppliedMigrations(conn);
    const appliedVersions = new Set(applied.map(r => r.version));

    const files = getMigrationFiles();
    const pending = files.filter(f => {
      const v = getVersionFromFilename(f);
      return v && !appliedVersions.has(v);
    });

    if (pending.length === 0) {
      console.log('✅ Aucune migration en attente. Base de données à jour.');
      return;
    }

    console.log(`📦 ${pending.length} migration(s) à appliquer :\n`);

    for (const file of pending) {
      const version = getVersionFromFilename(file);
      const name = getDisplayName(file);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const migration = parseMigrationFile(filePath);

      if (!migration.up) {
        console.log(`⚠️  ${file} — section UP vide, ignoré.`);
        continue;
      }

      process.stdout.write(`  ⏳ ${file} … `);
      try {
        await conn.query(migration.up);
        await conn.query(
          'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
          [version, name]
        );
        console.log('✅');
      } catch (err) {
        console.log('❌');
        console.error(`  Erreur dans ${file} :`);
        console.error(`  ${err.message}`);
        process.exit(1);
      }
    }

    console.log('\n🎉 Toutes les migrations ont été appliquées avec succès.');
  } finally {
    await conn.end();
  }
}

async function cmdDown(all = false) {
  const conn = await getConnection();
  try {
    await ensureMigrationsTable(conn);
    const applied = await getAppliedMigrations(conn);

    if (applied.length === 0) {
      console.log('✅ Aucune migration à annuler.');
      return;
    }

    const toRollback = all ? [...applied].reverse() : [applied[applied.length - 1]];
    const files = getMigrationFiles();

    console.log(`🔄 ${toRollback.length} migration(s) à annuler :\n`);

    for (const migration of toRollback) {
      const file = files.find(f => getVersionFromFilename(f) === migration.version);
      if (!file) {
        console.log(`  ⚠️  Fichier pour la version ${migration.version} introuvable, ignoré.`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const parsed = parseMigrationFile(filePath);

      if (!parsed.down) {
        console.log(`  ⚠️  ${file} — section DOWN absente ou vide, ignoré.`);
        // On retire quand même de la table des migrations
        await conn.execute('DELETE FROM schema_migrations WHERE version = ?', [migration.version]);
        continue;
      }

      process.stdout.write(`  ⏳ ${file} … `);
      try {
        await conn.query(parsed.down);
        await conn.query('DELETE FROM schema_migrations WHERE version = ?', [migration.version]);
        console.log('✅');
      } catch (err) {
        console.log('❌');
        console.error(`  Erreur dans la rollback de ${file} :`);
        console.error(`  ${err.message}`);
        process.exit(1);
      }
    }

    console.log('\n✅ Rollback terminé.');
  } finally {
    await conn.end();
  }
}

async function cmdStatus() {
  const conn = await getConnection();
  try {
    await ensureMigrationsTable(conn);
    const applied = await getAppliedMigrations(conn);
    const appliedMap = new Map(applied.map(r => [r.version, r]));
    const files = getMigrationFiles();

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║               ÉTAT DES MIGRATIONS                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    if (files.length === 0) {
      console.log('  Aucun fichier de migration trouvé dans src/migrations/\n');
      return;
    }

    console.log('  Version  │ Statut     │ Nom');
    console.log('  ─────────┼────────────┼──────────────────────────');

    for (const file of files) {
      const version = getVersionFromFilename(file);
      const name = getDisplayName(file);
      const appliedInfo = appliedMap.get(version);
      const status = appliedInfo
        ? `✅ appliqué  │ ${new Date(appliedInfo.applied_at).toLocaleString('fr-FR')}`
        : '⏳ en attente';
      console.log(`  ${version.padEnd(9)}│ ${status.padEnd(11)}│ ${name}`);
    }

    const pendingCount = files.filter(f => !appliedMap.has(getVersionFromFilename(f))).length;
    console.log(`\n  Total: ${files.length} | Appliquées: ${applied.length} | En attente: ${pendingCount}\n`);
  } finally {
    await conn.end();
  }
}

function cmdCreate(name) {
  if (!name) {
    console.error('❌ Veuillez fournir un nom pour la migration.');
    console.error('   Usage: node src/migrate.js create <nom_migration>');
    process.exit(1);
  }

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  const files = getMigrationFiles();
  let nextNum = 1;
  if (files.length > 0) {
    const lastVersion = getVersionFromFilename(files[files.length - 1]);
    nextNum = parseInt(lastVersion) + 1;
  }

  const version = String(nextNum).padStart(3, '0');
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const filename = `${version}_${safeName}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, filename);

  const template = `-- ============================================================
-- Migration ${version}: ${safeName}
-- Date: ${new Date().toISOString().split('T')[0]}
-- ============================================================

-- ## UP
-- Ajoutez ici les commandes SQL pour appliquer la migration


-- ## DOWN
-- Ajoutez ici les commandes SQL pour annuler la migration

`;

  fs.writeFileSync(filePath, template, 'utf-8');
  console.log(`✅ Migration créée : src/migrations/${filename}`);
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'up':
      await cmdUp();
      break;

    case 'down':
      await cmdDown(args.includes('--all'));
      break;

    case 'status':
      await cmdStatus();
      break;

    case 'create':
      cmdCreate(args[1]);
      break;

    default:
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║          GESTION SALAIRE — Système de Migrations            ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  node src/migrate.js <commande>

Commandes:
  up              Applique toutes les migrations en attente
  down            Annule la dernière migration appliquée
  down --all      Annule toutes les migrations
  status          Affiche l'état des migrations
  create <name>   Crée un nouveau fichier de migration

Exemples:
  node src/migrate.js up
  node src/migrate.js down
  node src/migrate.js status
  node src/migrate.js create add_roles_table
      `);
      break;
  }
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err.message);
  process.exit(1);
});
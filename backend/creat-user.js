const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

async function createUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    // Créer la base de données si elle n'existe pas
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'gestion_salaire'}`);
    await connection.changeUser({ database: process.env.DB_NAME || 'gestion_salaire' });

    // Vérifier si la table utilisateurs existe
    const [tables] = await connection.execute("SHOW TABLES LIKE 'utilisateurs'");
    if (tables.length === 0) {
      console.log('❌ La table utilisateurs n\'existe pas. Exécutez d\'abord schema.sql');
      process.exit(1);
    }

    // Hasher le mot de passe "admin123"
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const id = crypto.randomUUID();

    // Supprimer l'ancien utilisateur s'il existe
    await connection.execute("DELETE FROM utilisateurs WHERE email = 'admin@gmail.com'");

    // Insérer le nouvel utilisateur
    await connection.execute(`
      INSERT INTO utilisateurs (id, nom, prenom, email, mot_de_passe, role, actif)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, 'Admin', 'Système', 'admin@gmail.com', hashedPassword, 'admin', 1]);

    console.log('✅ Utilisateur créé avec succès !');
    console.log('   Email: admin@gmail.com');
    console.log('   Mot de passe: admin123');
    console.log(`   Hash: ${hashedPassword}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
}

createUser();
const crypto = require('crypto');
const { query, queryOne } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    return queryOne('SELECT * FROM utilisateurs WHERE email = ?', [email]);
  }

  static async findById(id) {
    return queryOne('SELECT id, nom, prenom, email, role, actif, derniere_connexion, cree_le FROM utilisateurs WHERE id = ?', [id]);
  }

  static async create(userData) {
    const { nom, prenom, email, motDePasse, role = 'lecture' } = userData;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(motDePasse, salt);
    
    const id = crypto.randomUUID();
    await query(
      'INSERT INTO utilisateurs (id, nom, prenom, email, mot_de_passe, role) VALUES (?, ?, ?, ?, ?, ?)',
      [id, nom, prenom, email, hashedPassword, role]
    );
    return this.findById(id);
  }

  static async updateLastLogin(id) {
    await query('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = ?', [id]);
  }

  static async comparePassword(password, hashedPassword) {
    if (!hashedPassword) return false;
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;
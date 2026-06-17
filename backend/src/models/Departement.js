const { query, queryOne } = require('../config/database');
const crypto = require('crypto');

class Departement {
  static async findAll() {
    return query('SELECT * FROM departements ORDER BY nom');
  }

  static async findById(id) {
    return queryOne('SELECT * FROM departements WHERE id = ?', [id]);
  }

  static async create(nom) {
    const id = crypto.randomUUID();
    await query('INSERT INTO departements (id, nom) VALUES (?, ?)', [id, nom]);
    return this.findById(id);
  }

  static async update(id, nom) {
    await query('UPDATE departements SET nom = ? WHERE id = ?', [nom, id]);
    return this.findById(id);
  }

  static async delete(id) {
    const employes = await query('SELECT id FROM employes WHERE departement_id = ? LIMIT 1', [id]);
    if (employes.length > 0) {
      throw new Error('Impossible de supprimer un département utilisé par des employés');
    }
    await query('DELETE FROM departements WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Departement;
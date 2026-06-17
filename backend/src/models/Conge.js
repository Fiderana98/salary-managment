const { query, queryOne } = require('../config/database');
const crypto = require('crypto');

class Conge {
  static async findAll(filters = {}) {
    let sql = `
      SELECT c.*, e.nom, e.prenom, e.matricule
      FROM employe_conges c
      LEFT JOIN employes e ON c.employe_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.employeId) {
      sql += ' AND c.employe_id = ?';
      params.push(filters.employeId);
    }
    if (filters.actif !== undefined) {
      sql += ' AND c.actif = ?';
      params.push(filters.actif ? 1 : 0);
    }

    sql += ' ORDER BY c.cree_le DESC';
    const results = await query(sql, params);
    return results.map(this.mapRow);
  }

  static async findById(id) {
    const row = await queryOne(`
      SELECT c.*, e.nom, e.prenom, e.matricule
      FROM employe_conges c
      LEFT JOIN employes e ON c.employe_id = e.id
      WHERE c.id = ?
    `, [id]);
    return row ? this.mapRow(row) : null;
  }

  static async findActifsByEmploye(employeId) {
    const results = await query(`
      SELECT c.*, e.nom, e.prenom, e.matricule
      FROM employe_conges c
      LEFT JOIN employes e ON c.employe_id = e.id
      WHERE c.employe_id = ? AND c.actif = 1
      ORDER BY c.cree_le DESC
    `, [employeId]);
    return results.map(this.mapRow);
  }

  static async create(data) {
    const id = crypto.randomUUID();

    await query(`
      INSERT INTO employe_conges (id, employe_id, libelle, motif, date_debut, date_fin, pourcentage_remuneration, actif)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      id,
      data.employeId,
      data.libelle,
      data.motif || null,
      data.dateDebut,
      data.dateFin,
      data.pourcentageRemuneration ?? 100.00,
    ]);

    return this.findById(id);
  }

  static async update(id, data) {
    const existing = await queryOne('SELECT * FROM employe_conges WHERE id = ?', [id]);
    if (!existing) throw new Error('Congé non trouvé');

    await query(`
      UPDATE employe_conges SET
        libelle = ?,
        motif = ?,
        date_debut = ?,
        date_fin = ?,
        pourcentage_remuneration = ?,
        actif = ?,
        modifie_le = NOW()
      WHERE id = ?
    `, [
      data.libelle ?? existing.libelle,
      data.motif !== undefined ? data.motif : existing.motif,
      data.dateDebut ?? existing.date_debut,
      data.dateFin ?? existing.date_fin,
      data.pourcentageRemuneration ?? existing.pourcentage_remuneration,
      data.actif !== undefined ? (data.actif ? 1 : 0) : existing.actif,
      id,
    ]);

    return this.findById(id);
  }

  static async desactiver(id) {
    await query('UPDATE employe_conges SET actif = 0, modifie_le = NOW() WHERE id = ?', [id]);
    return this.findById(id);
  }

  static async delete(id) {
    await query('DELETE FROM employe_conges WHERE id = ?', [id]);
    return true;
  }

  static mapRow(row) {
    return {
      id: row.id,
      employeId: row.employe_id,
      libelle: row.libelle,
      motif: row.motif,
      dateDebut: row.date_debut ? row.date_debut.toISOString().split('T')[0] : null,
      dateFin: row.date_fin ? row.date_fin.toISOString().split('T')[0] : null,
      pourcentageRemuneration: parseFloat(row.pourcentage_remuneration) || 0,
      actif: !!(row.actif),
      creeLe: row.cree_le,
      modifieLe: row.modifie_le,
      employeNom: row.nom ? `${row.nom} ${row.prenom}` : null,
      employeMatricule: row.matricule,
    };
  }
}

module.exports = Conge;
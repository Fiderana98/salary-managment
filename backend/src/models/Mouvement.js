const { query, queryOne } = require('../config/database');
const crypto = require('crypto');

class Mouvement {
  static async findAll(filters = {}) {
    let sql = `
      SELECT m.*, e.nom, e.prenom, e.matricule
      FROM employe_mouvements m
      LEFT JOIN employes e ON m.employe_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.employeId) {
      sql += ' AND m.employe_id = ?';
      params.push(filters.employeId);
    }
    if (filters.type) {
      sql += ' AND m.type = ?';
      params.push(filters.type);
    }
    if (filters.actif !== undefined) {
      sql += ' AND m.actif = ?';
      params.push(filters.actif ? 1 : 0);
    }

    sql += ' ORDER BY m.cree_le DESC';
    const results = await query(sql, params);
    return results.map(this.mapRow);
  }

  static async findById(id) {
    const row = await queryOne(`
      SELECT m.*, e.nom, e.prenom, e.matricule
      FROM employe_mouvements m
      LEFT JOIN employes e ON m.employe_id = e.id
      WHERE m.id = ?
    `, [id]);
    return row ? this.mapRow(row) : null;
  }

  static async findActifsByEmploye(employeId) {
    const results = await query(`
      SELECT m.*, e.nom, e.prenom, e.matricule
      FROM employe_mouvements m
      LEFT JOIN employes e ON m.employe_id = e.id
      WHERE m.employe_id = ? AND m.actif = 1
      ORDER BY m.cree_le DESC
    `, [employeId]);
    return results.map(this.mapRow);
  }

  static async create(data) {
    const id = crypto.randomUUID();

    await query(`
      INSERT INTO employe_mouvements (id, employe_id, type, motif, date_debut, date_fin, indemnite, pourcentage_remuneration, actif)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      id,
      data.employeId,
      data.type,
      data.motif,
      data.dateDebut,
      data.dateFin || null,
      data.indemnite || 0,
      data.pourcentageRemuneration || null,
    ]);

    return this.findById(id);
  }

  static async update(id, data) {
    const existing = await queryOne('SELECT * FROM employe_mouvements WHERE id = ?', [id]);
    if (!existing) throw new Error('Mouvement non trouvé');

    await query(`
      UPDATE employe_mouvements SET
        motif = ?,
        date_debut = ?,
        date_fin = ?,
        indemnite = ?,
        pourcentage_remuneration = ?,
        actif = ?,
        modifie_le = NOW()
      WHERE id = ?
    `, [
      data.motif ?? existing.motif,
      data.dateDebut ?? existing.date_debut,
      data.dateFin !== undefined ? data.dateFin : existing.date_fin,
      data.indemnite ?? existing.indemnite,
      data.pourcentageRemuneration !== undefined ? data.pourcentageRemuneration : existing.pourcentage_remuneration,
      data.actif !== undefined ? (data.actif ? 1 : 0) : existing.actif,
      id,
    ]);

    return this.findById(id);
  }

  static async desactiver(id) {
    await query('UPDATE employe_mouvements SET actif = 0, modifie_le = NOW() WHERE id = ?', [id]);
    return this.findById(id);
  }

  static async delete(id) {
    await query('DELETE FROM employe_mouvements WHERE id = ?', [id]);
    return true;
  }

  // Désactiver les mouvements dont la date de fin est passée et qui sont encore actifs
  static async desactiverExpired() {
    const today = new Date().toISOString().split('T')[0];
    // Met à jour les enregistrements où date_fin <= aujourd'hui et actif = 1
    await query(
      `UPDATE employe_mouvements 
       SET actif = 0, modifie_le = NOW() 
       WHERE date_fin IS NOT NULL 
         AND date_fin <= ? 
         AND actif = 1`,
      [today]
    );
    // Retourner le nombre de lignes affectées (optionnel)
    return true;
  }

  static async getMouvementsRecents(limit = 10) {
    const results = await query(`
      SELECT m.*, e.nom, e.prenom, e.matricule
      FROM employe_mouvements m
      LEFT JOIN employes e ON m.employe_id = e.id
      ORDER BY m.cree_le DESC
      LIMIT ?
    `, [limit]);
    return results.map(this.mapRow);
  }

  static mapRow(row) {
    return {
      id: row.id,
      employeId: row.employe_id,
      type: row.type,
      motif: row.motif,
      dateDebut: row.date_debut ? row.date_debut.toISOString().split('T')[0] : null,
      dateFin: row.date_fin ? row.date_fin.toISOString().split('T')[0] : null,
      indemnite: parseFloat(row.indemnite) || 0,
      pourcentageRemuneration: row.pourcentage_remuneration ? parseFloat(row.pourcentage_remuneration) : null,
      actif: !!(row.actif),
      creeLe: row.cree_le,
      modifieLe: row.modifie_le,
      employeNom: row.nom ? `${row.nom} ${row.prenom}` : null,
      employeMatricule: row.matricule,
    };
  }
}

module.exports = Mouvement;
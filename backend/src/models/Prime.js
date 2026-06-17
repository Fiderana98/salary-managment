const { query } = require('../config/database');

class Prime {
  static async findAll() {
    const rows = await query(
      'SELECT * FROM primes ORDER BY cree_le DESC'
    );
    return rows.map(this.mapPrime);
  }

  static async findById(id) {
    const rows = await query(
      'SELECT * FROM primes WHERE id = ?',
      [id]
    );
    return rows.length ? this.mapPrime(rows[0]) : null;
  }

  static async findByEmploye(employeId, periode) {
    // S'assurer que periode est au format YYYY-MM-DD
    const datePeriode = `${periode}-01`; // Premier jour du mois
    
    const rows = await query(
      `SELECT * FROM primes 
      WHERE actif = 1 
        AND (date_debut IS NULL OR date_debut <= ?)
        AND (date_fin IS NULL OR date_fin >= ?)
        AND (
          type = 'automatique'
          OR (cible = 'personne' AND employe_id = ?)
          OR (cible = 'departement' AND departement_id IN (SELECT departement_id FROM employes WHERE id = ?))
          OR (cible = 'tous')
        )
      ORDER BY cree_le DESC`,
      [datePeriode, datePeriode, employeId, employeId]
    );
    
    console.log(`Primes trouvées pour employé ${employeId}:`, rows.length);
    return rows.map(this.mapPrime);
  }

  static async create(data) {
    const crypto = require('crypto');
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO primes (id, libelle, type, cible, employe_id, departement_id, mode, valeur, imposable, actif, date_debut, date_fin, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.libelle,
        data.type || 'ciblee',
        data.cible || null,
        data.employeId || null,
        data.departementId || null,
        data.mode || 'fixe',
        data.valeur || 0,
        data.imposable !== undefined ? data.imposable : true,
        data.actif !== undefined ? data.actif : true,
        data.dateDebut || new Date().toISOString().split('T')[0],
        data.dateFin || null,
        data.description || ''
      ]
    );
    return this.findById(id);
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.libelle !== undefined) { fields.push('libelle = ?'); values.push(data.libelle); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.cible !== undefined) { fields.push('cible = ?'); values.push(data.cible); }
    if (data.employeId !== undefined) { fields.push('employe_id = ?'); values.push(data.employeId); }
    if (data.departementId !== undefined) { fields.push('departement_id = ?'); values.push(data.departementId); }
    if (data.mode !== undefined) { fields.push('mode = ?'); values.push(data.mode); }
    if (data.valeur !== undefined) { fields.push('valeur = ?'); values.push(data.valeur); }
    if (data.imposable !== undefined) { fields.push('imposable = ?'); values.push(data.imposable ? 1 : 0); }
    if (data.actif !== undefined) { fields.push('actif = ?'); values.push(data.actif); }
    if (data.dateDebut !== undefined) { fields.push('date_debut = ?'); values.push(data.dateDebut); }
    if (data.dateFin !== undefined) { fields.push('date_fin = ?'); values.push(data.dateFin); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await query(
      `UPDATE primes SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return this.findById(id);
  }

  static async delete(id) {
    await query('DELETE FROM primes WHERE id = ?', [id]);
  }

  static mapPrime(row) {
    return {
      id: row.id,
      libelle: row.libelle,
      type: row.type,
      cible: row.cible,
      employeId: row.employe_id,
      departementId: row.departement_id,
      mode: row.mode,
      valeur: parseFloat(row.valeur),
      imposable: !!(row.imposable),
      actif: !!(row.actif),
      dateDebut: row.date_debut instanceof Date ? row.date_debut.toISOString().split('T')[0] : (row.date_debut || null),
      dateFin: row.date_fin instanceof Date ? row.date_fin.toISOString().split('T')[0] : (row.date_fin || null),
      description: row.description || '',
      creeLe: row.cree_le instanceof Date ? row.cree_le.toISOString() : (row.cree_le || new Date().toISOString()),
    };
  }
}

module.exports = Prime;
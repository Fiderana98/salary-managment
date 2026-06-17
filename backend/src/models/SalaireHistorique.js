const { query, transaction } = require('../config/database');
const crypto = require('crypto');

class SalaireHistorique {
  static mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      employeId: row.employe_id,
      typeChangement: row.type_changement,
      ancienSalaire: parseFloat(row.ancien_salaire) || 0,
      nouveauSalaire: parseFloat(row.nouveau_salaire) || 0,
      ancienPoste: row.ancien_poste || null,
      nouveauPoste: row.nouveau_poste || null,
      motif: row.motif || '',
      periodeEffet: row.periode_effet,
      creeLe: row.cree_le,
    };
  }

  static async findByEmployeId(employeId) {
    const results = await query(
      'SELECT * FROM historique_salaires WHERE employe_id = ? ORDER BY cree_le DESC',
      [employeId]
    );
    return results.map(this.mapRow);
  }

  static async create(data) {
    return transaction(async (conn) => {
      const id = crypto.randomUUID();
      await conn.execute(`
        INSERT INTO historique_salaires (
          id, employe_id, type_changement,
          ancien_salaire, nouveau_salaire,
          ancien_poste, nouveau_poste,
          motif, periode_effet
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.employeId,
        data.typeChangement,
        data.ancienSalaire || 0,
        data.nouveauSalaire || 0,
        data.ancienPoste || null,
        data.nouveauPoste || null,
        data.motif || null,
        data.periodeEffet,
      ]);
      
      // Mettre à jour le salaire et le poste de l'employé
      const updates = [];
      const params = [];
      
      if (data.nouveauSalaire !== undefined && data.nouveauSalaire !== null) {
        updates.push('salaire_brut = ?');
        params.push(data.nouveauSalaire);
      }
      if (data.nouveauPoste) {
        updates.push('poste = ?');
        params.push(data.nouveauPoste);
      }
      
      if (updates.length > 0) {
        updates.push('modifie_le = NOW()');
        params.push(data.employeId);
        await conn.execute(
          `UPDATE employes SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
      }
      
      return this.mapRow({
        id,
        employe_id: data.employeId,
        type_changement: data.typeChangement,
        ancien_salaire: data.ancienSalaire,
        nouveau_salaire: data.nouveauSalaire,
        ancien_poste: data.ancienPoste,
        nouveau_poste: data.nouveauPoste,
        motif: data.motif,
        periode_effet: data.periodeEffet,
        cree_le: new Date(),
      });
    });
  }
}

module.exports = SalaireHistorique;
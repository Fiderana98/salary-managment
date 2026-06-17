const { query, queryOne } = require('../config/database');

class Parametres {
  static async get() {
    const params = await queryOne('SELECT * FROM parametres_paie ORDER BY id DESC LIMIT 1');
    if (params) {
      const tranches = await query('SELECT * FROM tranches_irsa WHERE parametres_paie_id = ? ORDER BY rang', [params.id]);
      params.tranches_irsa = tranches.map(t => ({
        min: parseFloat(t.montant_min),
        max: t.montant_max ? parseFloat(t.montant_max) : null,
        taux: parseFloat(t.taux),
      }));
    }
    return params;
  }

  static async update(data) {
    // Vérifier si des paramètres existent
    let existing = await queryOne('SELECT id FROM parametres_paie LIMIT 1');
    
    if (existing) {
      await query(`
        UPDATE parametres_paie SET
          sme_non_agricole = ?, sme_agricole = ?, plafond_multiplier = ?,
          cnaps_salarial = ?, cnaps_patronal = ?, ostie_salariale = ?,
          ostie_patronale = ?, fmfp_patronal = ?, heures_travail_mensuel = ?,
          taux_heure_supplementaire = ?, prime_anciennete_taux = ?,
          prime_transport_defaut = ?, modifie_le = NOW()
        WHERE id = ?
      `, [
        data.sme_non_agricole, data.sme_agricole, data.plafond_multiplier,
        data.cnaps_salarial, data.cnaps_patronal ?? 0, data.ostie_salariale,
        data.ostie_patronale ?? 0, data.fmfp_patronal ?? 0, data.heures_travail_mensuel,
        data.taux_heure_supplementaire, data.prime_anciennete_taux,
        data.prime_transport_defaut, existing.id
      ]);
      const paramsId = existing.id;
      
      // Mettre à jour les tranches
      await query('DELETE FROM tranches_irsa WHERE parametres_paie_id = ?', [paramsId]);
      for (let i = 0; i < data.tranches_irsa.length; i++) {
        const t = data.tranches_irsa[i];
        await query(`
          INSERT INTO tranches_irsa (parametres_paie_id, rang, montant_min, montant_max, taux)
          VALUES (?, ?, ?, ?, ?)
        `, [paramsId, i + 1, t.min, t.max, t.taux]);
      }
    } else {
      // Création initiale
      await query(`
        INSERT INTO parametres_paie (
          sme_non_agricole, sme_agricole, plafond_multiplier, cnaps_salarial,
          cnaps_patronal, ostie_salariale, ostie_patronale, fmfp_patronal,
          heures_travail_mensuel, taux_heure_supplementaire,
          prime_anciennete_taux, prime_transport_defaut
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.sme_non_agricole, data.sme_agricole, data.plafond_multiplier,
        data.cnaps_salarial, data.cnaps_patronal ?? 0, data.ostie_salariale,
        data.ostie_patronale ?? 0, data.fmfp_patronal ?? 0, data.heures_travail_mensuel,
        data.taux_heure_supplementaire, data.prime_anciennete_taux,
        data.prime_transport_defaut
      ]);
      
      const paramsId = await queryOne('SELECT LAST_INSERT_ID() as id');
      for (let i = 0; i < data.tranches_irsa.length; i++) {
        const t = data.tranches_irsa[i];
        await query(`
          INSERT INTO tranches_irsa (parametres_paie_id, rang, montant_min, montant_max, taux)
          VALUES (?, ?, ?, ?, ?)
        `, [paramsId.id, i + 1, t.min, t.max, t.taux]);
      }
    }
    
    return this.get();
  }
}

module.exports = Parametres;
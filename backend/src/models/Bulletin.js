const { query, queryOne, transaction } = require('../config/database');
const crypto = require('crypto');
const CalculPaie = require('../services/calculPaie');
const Employe = require('./Employe');
const Parametres = require('./Parametres');
const Prime = require('./Prime');

class Bulletin {
  // Fonction utilitaire pour convertir undefined en null
  static toSqlValue(value) {
    return value === undefined ? null : value;
  }

  // Convertir les résultats de la base de données en camelCase
  static mapBulletin(row) {
    if (!row) return null;
    return {
      id: row.id,
      employeId: row.employe_id,
      periode: row.periode,
      salaireBrut: parseFloat(row.salaire_brut) || 0,
      heuresSupplementaires: parseFloat(row.heures_supplementaires) || 0,
      montantHeuresSup: parseFloat(row.montant_heures_sup) || 0,
      primeTransport: parseFloat(row.prime_transport) || 0,
      primeAnciennete: parseFloat(row.prime_anciennete) || 0,
      autresPrimes: (row.primes || []).map(p => ({
        libelle: p.libelle,
        montant: parseFloat(p.montant) || 0,
        imposable: !!p.imposable,
      })),
      totalBrut: parseFloat(row.total_brut) || 0,
      cnaps_salarial: parseFloat(row.cnaps_salarial) || 0,
      ostie_salariale: parseFloat(row.ostie_salariale) || 0,
      totalCotisationsSalariales: parseFloat(row.total_cotisations_salariales) || 0,
      irsa: parseFloat(row.irsa) || 0,
      salaireNet: parseFloat(row.salaire_net) || 0,
      statut: row.statut,
      dateCreation: row.cree_le,
      dateValidation: row.date_validation,
      datePaiement: row.date_paiement,
      nom: row.nom,
      prenom: row.prenom,
      matricule: row.matricule,
      poste: row.poste,
      rib: row.rib
    };
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT b.*, e.nom, e.prenom, e.matricule, e.poste
      FROM bulletins_paie b
      JOIN employes e ON b.employe_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.periode) {
      sql += ' AND b.periode = ?';
      params.push(filters.periode);
    }
    if (filters.statut) {
      sql += ' AND b.statut = ?';
      params.push(filters.statut);
    }
    if (filters.employeId) {
      sql += ' AND b.employe_id = ?';
      params.push(filters.employeId);
    }

    sql += ' ORDER BY b.periode DESC, e.nom, e.prenom';
    const results = await query(sql, params);

    if (results.length === 0) return [];

    const bulletinIds = results.map(r => r.id);
    const placeholders = bulletinIds.map(() => '?').join(',');
    const allPrimes = await query(
      `SELECT * FROM bulletin_primes WHERE bulletin_id IN (${placeholders})`,
      bulletinIds
    );
    const primesParBulletin = allPrimes.reduce((acc, p) => {
      if (!acc[p.bulletin_id]) acc[p.bulletin_id] = [];
      acc[p.bulletin_id].push(p);
      return acc;
    }, {});

    return results.map(row => this.mapBulletin({
      ...row,
      primes: primesParBulletin[row.id] || [],
    }));
  }

  static async findById(id) {
    const bulletin = await queryOne(`
      SELECT b.*, e.nom, e.prenom, e.matricule, e.poste, e.rib
      FROM bulletins_paie b
      JOIN employes e ON b.employe_id = e.id
      WHERE b.id = ?
    `, [id]);
    
    if (bulletin) {
      const primes = await query('SELECT * FROM bulletin_primes WHERE bulletin_id = ?', [id]);
      bulletin.primes = primes;
    }
    return this.mapBulletin(bulletin);
  }

  static async genererPourPeriode(periode) {
    return transaction(async (conn) => {
      console.log(`Génération des bulletins pour la période ${periode}...`);
      
      // Vérifier si les bulletins existent déjà
      const existing = await query(
        'SELECT id FROM bulletins_paie WHERE periode = ? LIMIT 1',
        [periode]
      );
      
      if (existing && existing.length > 0) {
        throw new Error(`Les bulletins pour la période ${periode} existent déjà.`);
      }
      
      // Récupérer tous les employés actifs embauchés avant la fin de la période
      const employes = await Employe.findAllActifsForPeriode(periode);
      
      console.log(`Employés actifs trouvés: ${employes.length}`);
      
      if (!employes || employes.length === 0) {
        throw new Error('Aucun employé actif trouvé');
      }
      
      // Afficher le premier employé pour debug
      if (employes[0]) {
        console.log('Exemple employé:', {
          id: employes[0].id,
          nom: employes[0].nom,
          salaireBrut: employes[0].salaireBrut
        });
      }
      
      // Récupérer les paramètres
      let parametres = await Parametres.get();
      
      // Si pas de paramètres, en créer par défaut
      if (!parametres) {
        const { parametresDefaut } = require('../data/parametresDefaut');
        await Parametres.update(parametresDefaut);
        parametres = await Parametres.get();
      }
      
      const bulletinsGeneres = [];
      
      for (const employe of employes) {
        // Récupérer les primes actives pour l'employé et la période
        const primesEmploye = await Prime.findByEmploye(employe.id, periode);
        console.log(`Primes pour ${employe.nom} ${employe.prenom}:`, primesEmploye);
        
        const autresPrimes = primesEmploye.map(p => {
          let montant = p.valeur;
          if (p.mode === 'taux') {
            montant = (employe.salaireBrut * p.valeur / 100);
          }
          return {
            libelle: p.libelle,
            montant: montant,
            imposable: !!p.imposable, // Utilise le champ imposable de la table primes
          };
        });
        
        console.log(`Autres primes calculées:`, autresPrimes);
        
        const bulletinData = CalculPaie.calculer(employe, periode, parametres, {
          heuresSup: 0,
          autresPrimes,
        });
        const id = crypto.randomUUID();
        
        await conn.execute(`
          INSERT INTO bulletins_paie (
            id, employe_id, periode, salaire_brut, heures_supplementaires,
            montant_heures_sup, prime_transport, prime_anciennete, total_brut,
            cnaps_salarial, ostie_salariale, total_cotisations_salariales, irsa,
            salaire_net, cnaps_patronal, ostie_patronale, fmfp_patronal,
            total_charges_patronales, cout_total_employeur, statut, cree_le
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?, NOW())
        `, [
          id, 
          employe.id,
          periode,
          bulletinData.salaireBrut,
          bulletinData.heuresSupplementaires,
          bulletinData.montantHeuresSup,
          bulletinData.primeTransport,
          bulletinData.primeAnciennete,
          bulletinData.totalBrut,
          bulletinData.cnaps_salarial,
          bulletinData.ostie_salariale,
          bulletinData.totalCotisationsSalariales,
          bulletinData.irsa,
          bulletinData.salaireNet,
          bulletinData.totalBrut,
          'brouillon'
        ]);

        for (const prime of bulletinData.autresPrimes || []) {
          await conn.execute(`
            INSERT INTO bulletin_primes (bulletin_id, libelle, montant, imposable)
            VALUES (?, ?, ?, ?)
          `, [id, prime.libelle, prime.montant, prime.imposable ? 1 : 0]);
        }
        
        bulletinsGeneres.push({ 
          id, 
          employeId: employe.id, 
          nom: `${employe.nom} ${employe.prenom}`,
          salaireBrut: bulletinData.salaireBrut,
          salaireNet: bulletinData.salaireNet
        });
      }
      
      console.log(`Génération terminée: ${bulletinsGeneres.length} bulletins créés`);
      
      return {
        message: `${bulletinsGeneres.length} bulletins générés pour la période ${periode}`,
        bulletins: bulletinsGeneres,
        periode,
        total: bulletinsGeneres.length
      };
    });
  }

  static async create(bulletinData, primes = []) {
    return transaction(async (conn) => {
      const id = crypto.randomUUID();
      
      await conn.execute(`
        INSERT INTO bulletins_paie (
          id, employe_id, periode, salaire_brut, heures_supplementaires,
          montant_heures_sup, prime_transport, prime_anciennete, total_brut,
          cnaps_salarial, ostie_salariale, total_cotisations_salariales, irsa,
          salaire_net, cnaps_patronal, ostie_patronale, fmfp_patronal,
          total_charges_patronales, cout_total_employeur, statut
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, 
        bulletinData.employeId,
        bulletinData.periode,
        bulletinData.salaireBrut || 0,
        bulletinData.heuresSupplementaires || 0,
        bulletinData.montantHeuresSup || 0,
        bulletinData.primeTransport || 0,
        bulletinData.primeAnciennete || 0,
        bulletinData.totalBrut || 0,
        bulletinData.cnaps_salarial || 0,
        bulletinData.ostie_salariale || 0,
        bulletinData.totalCotisationsSalariales || 0,
        bulletinData.irsa || 0,
        bulletinData.salaireNet || 0,
        0, 0, 0, 0,
        bulletinData.totalBrut || 0,
        'brouillon'
      ]);

      for (const prime of primes) {
        await conn.execute(`
          INSERT INTO bulletin_primes (bulletin_id, libelle, montant, imposable)
          VALUES (?, ?, ?, ?)
        `, [id, prime.libelle, prime.montant, prime.imposable ? 1 : 0]);
      }

      return this.findById(id);
    });
  }

  static async updateStatut(id, statut, dateField = null) {
    let sql = `UPDATE bulletins_paie SET statut = ?, modifie_le = NOW()`;
    const params = [statut];
    
    if (dateField === 'validation') {
      sql += `, date_validation = NOW()`;
    }
    if (dateField === 'paiement') {
      sql += `, date_paiement = NOW()`;
    }
    
    sql += ` WHERE id = ?`;
    params.push(id);
    
    await query(sql, params);
    return this.findById(id);
  }

  static async deleteByPeriode(periode) {
    return transaction(async (conn) => {
      // Supprimer d'abord les primes associées
      await conn.execute(`
        DELETE FROM bulletin_primes 
        WHERE bulletin_id IN (SELECT id FROM bulletins_paie WHERE periode = ?)
      `, [periode]);
      
      // Puis supprimer les bulletins
      await conn.execute('DELETE FROM bulletins_paie WHERE periode = ?', [periode]);
    });
  }

  static async getStatsParPeriode() {
    const results = await query(`
      SELECT 
        periode,
        COUNT(*) as total_bulletins,
        SUM(salaire_net) as total_masse_salariale,
        SUM(total_brut) as total_brut,
        SUM(CASE WHEN statut = 'paye' THEN 1 ELSE 0 END) as payes
      FROM bulletins_paie
      GROUP BY periode
      ORDER BY periode DESC
    `);
    
    return results.map(row => ({
      periode: row.periode,
      total_bulletins: row.total_bulletins,
      total_masse_salariale: parseFloat(row.total_masse_salariale) || 0,
      total_brut: parseFloat(row.total_brut) || 0,
      payes: row.payes
    }));
  }
}

module.exports = Bulletin;
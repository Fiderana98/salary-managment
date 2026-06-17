const { query, queryOne } = require('../config/database');
const crypto = require('crypto');

class Employe {
    static async findAll(filters = {}) {
    let sql = `
      SELECT e.*, d.nom as departement_nom 
      FROM employes e 
      LEFT JOIN departements d ON e.departement_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.statut) {
      sql += ' AND e.statut = ?';
      params.push(filters.statut);
    }
    if (filters.departementId) {
      sql += ' AND e.departement_id = ?';
      params.push(filters.departementId);
    }
    if (filters.search) {
      sql += ' AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.matricule LIKE ?)';
      const search = `%${filters.search}%`;
      params.push(search, search, search);
    }

    sql += ' ORDER BY e.nom, e.prenom';
    const results = await query(sql, params);
    
    // Convertir les noms de colonnes snake_case en camelCase
    return results.map(row => ({
      id: row.id,
      matricule: row.matricule,
      nom: row.nom,
      prenom: row.prenom,
      sexe: row.sexe,
      dateNaissance: row.date_naissance,
      dateEmbauche: row.date_embauche,
      poste: row.poste,
      departement: row.departement_nom,
      departementId: row.departement_id,
      statut: row.statut,
      salaireBrut: parseFloat(row.salaire_brut) || 0,
      email: row.email || '',
      telephone: row.telephone || '',
      adresse: row.adresse || '',
      nombreEnfants: row.nombre_enfants || 0,
      rib: row.rib || '',
    }));
  }

  static async findById(id) {
    const row = await queryOne(`
      SELECT e.*, d.nom as departement_nom 
      FROM employes e 
      LEFT JOIN departements d ON e.departement_id = d.id 
      WHERE e.id = ?
    `, [id]);
    if (!row) return null;
    
    return {
      id: row.id,
      matricule: row.matricule,
      nom: row.nom,
      prenom: row.prenom,
      sexe: row.sexe,
      dateNaissance: row.date_naissance,
      dateEmbauche: row.date_embauche,
      poste: row.poste,
      departement: row.departement_nom,
      departementId: row.departement_id,
      statut: row.statut,
      salaireBrut: parseFloat(row.salaire_brut) || 0,
      email: row.email || '',
      telephone: row.telephone || '',
      adresse: row.adresse || '',
      nombreEnfants: row.nombre_enfants || 0,
      rib: row.rib || '',
    };
  }

  static async findByMatricule(matricule) {
    return queryOne('SELECT * FROM employes WHERE matricule = ?', [matricule]);
  }

  static async generateMatricule() {
    const last = await queryOne('SELECT matricule FROM employes ORDER BY cree_le DESC LIMIT 1');
    if (last && last.matricule) {
      const num = parseInt(last.matricule.replace('EMP', '')) + 1;
      return `EMP${String(num).padStart(4, '0')}`;
    }
    return 'EMP0001';
  }

  static async create(employeData) {
    const id = crypto.randomUUID();
    const matricule = await this.generateMatricule();
    
    const formatDate = (date) => {
      if (!date) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
      } catch {
        return null;
      }
    };
    
    // Conversion stricte : undefined → null
    const toSqlValue = (value) => (value === undefined ? null : value);
    
    let departementId = employeData.departementId;
    if (!departementId && employeData.departement) {
      let dept = await queryOne('SELECT id FROM departements WHERE nom = ?', [employeData.departement]);
      if (!dept) {
        const newDeptId = crypto.randomUUID();
        await query('INSERT INTO departements (id, nom) VALUES (?, ?)', [newDeptId, employeData.departement]);
        departementId = newDeptId;
      } else {
        departementId = dept.id;
      }
    }
    
    const dateNaissance = formatDate(employeData.dateNaissance);
    const dateEmbauche = formatDate(employeData.dateEmbauche);
    
    // Préparer chaque valeur avec toSqlValue (même celles déjà traitées)
    const values = {
      id: toSqlValue(id),
      matricule: toSqlValue(matricule),
      nom: toSqlValue(employeData.nom),
      prenom: toSqlValue(employeData.prenom),
      sexe: toSqlValue(employeData.sexe) || 'M',
      dateNaissance: toSqlValue(dateNaissance),
      dateEmbauche: toSqlValue(dateEmbauche),
      poste: toSqlValue(employeData.poste),
      departementId: toSqlValue(departementId),
      statut: toSqlValue(employeData.statut) || 'actif',
      salaireBrut: toSqlValue(employeData.salaireBrut),
      email: toSqlValue(employeData.email),
      telephone: toSqlValue(employeData.telephone),
      adresse: toSqlValue(employeData.adresse),
      nombreEnfants: toSqlValue(employeData.nombreEnfants) ?? 0,
      rib: toSqlValue(employeData.rib),
    };
    
    // Vérification et log des undefined restants
    const params = [
      values.id, values.matricule, values.nom, values.prenom, values.sexe,
      values.dateNaissance, values.dateEmbauche, values.poste, values.departementId,
      values.statut, values.salaireBrut,
      values.email, values.telephone, values.adresse, values.nombreEnfants, values.rib
    ];
    
    // Log pour debug (à retirer après correction)
    console.log('SQL Parameters before query:', params.map((v, i) => `[${i}]: ${v === undefined ? 'UNDEFINED' : v}`).join(', '));
    
    // Vérification finale : si un paramètre est undefined, on le force à null
    const safeParams = params.map(p => p === undefined ? null : p);
    
    await query(`
      INSERT INTO employes (
        id, matricule, nom, prenom, sexe, date_naissance, date_embauche,
        poste, departement_id, statut, salaire_brut,
        email, telephone, adresse, nombre_enfants, rib
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, safeParams);
    
    return this.findById(id);
  }

  static async update(id, employeData) {
    // Formater les dates
    const formatDate = (date) => {
      if (!date) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
      } catch {
        return null;
      }
    };
    
    // Gérer le département
    let departementId = employeData.departementId;
    if (!departementId && employeData.departement) {
      let dept = await queryOne('SELECT id FROM departements WHERE nom = ?', [employeData.departement]);
      if (!dept) {
        const newDeptId = crypto.randomUUID();
        await query('INSERT INTO departements (id, nom) VALUES (?, ?)', [newDeptId, employeData.departement]);
        departementId = newDeptId;
      } else {
        departementId = dept.id;
      }
    }
    
    const dateNaissance = formatDate(employeData.dateNaissance);
    const dateEmbauche = formatDate(employeData.dateEmbauche);
    
    // Récupérer l'employé existant
    const existing = await this.findById(id);
    if (!existing) throw new Error('Employé non trouvé');
    
    // Convertir undefined en null pour éviter l'erreur SQL
    const toSqlValue = (value) => {
      if (value === undefined) return null;
      return value;
    };
    
    // Fusionner les données et convertir undefined en null
    const finalData = {
      nom: toSqlValue(employeData.nom ?? existing.nom),
      prenom: toSqlValue(employeData.prenom ?? existing.prenom),
      sexe: toSqlValue(employeData.sexe ?? existing.sexe),
      dateNaissance: toSqlValue(dateNaissance ?? existing.dateNaissance),
      dateEmbauche: toSqlValue(dateEmbauche ?? existing.dateEmbauche),
      poste: toSqlValue(employeData.poste ?? existing.poste),
      departementId: toSqlValue(departementId ?? existing.departementId),
      statut: toSqlValue(employeData.statut ?? existing.statut),
      salaireBrut: toSqlValue(employeData.salaireBrut ?? existing.salaireBrut),
      email: toSqlValue(employeData.email !== undefined ? employeData.email : existing.email),
      telephone: toSqlValue(employeData.telephone !== undefined ? employeData.telephone : existing.telephone),
      adresse: toSqlValue(employeData.adresse !== undefined ? employeData.adresse : existing.adresse),
      nombreEnfants: toSqlValue(employeData.nombreEnfants ?? existing.nombreEnfants),
      rib: toSqlValue(employeData.rib !== undefined ? employeData.rib : existing.rib),
    };
    
    console.log('Final data for update:', finalData);
    
    await query(`
      UPDATE employes SET
        nom = ?, prenom = ?, sexe = ?, date_naissance = ?, date_embauche = ?,
        poste = ?, departement_id = ?, statut = ?,
        salaire_brut = ?, email = ?, telephone = ?, adresse = ?,
        nombre_enfants = ?, rib = ?, modifie_le = NOW()
      WHERE id = ?
    `, [
      finalData.nom, finalData.prenom, finalData.sexe,
      finalData.dateNaissance, finalData.dateEmbauche,
      finalData.poste, finalData.departementId,
      finalData.statut,
      finalData.salaireBrut, finalData.email, finalData.telephone,
      finalData.adresse, finalData.nombreEnfants, finalData.rib, id
    ]);
    
    return this.findById(id);
  }

  static async delete(id) {
    // D'abord supprimer les bulletins liés
    await query('DELETE FROM bulletins_paie WHERE employe_id = ?', [id]);
    await query('DELETE FROM employes WHERE id = ?', [id]);
    return true;
  }

  static async findAllActifsForPeriode(periode) {
    // Calculer le dernier jour de la période (mois)
    const [annee, mois] = periode.split('-').map(Number);
    const dernierJourPeriode = new Date(annee, mois, 0); // 0 = dernier jour du mois précédent
    const dateFinPeriode = dernierJourPeriode.toISOString().split('T')[0]; // YYYY-MM-DD
    
    let sql = `
      SELECT e.*, d.nom as departement_nom 
      FROM employes e 
      LEFT JOIN departements d ON e.departement_id = d.id
      WHERE (e.statut = 'actif' OR e.statut = 'conge')
      AND e.date_embauche <= ?
      ORDER BY e.nom, e.prenom
    `;
    
    const results = await query(sql, [dateFinPeriode]);
    
    return results.map(row => ({
      id: row.id,
      matricule: row.matricule,
      nom: row.nom,
      prenom: row.prenom,
      sexe: row.sexe,
      dateNaissance: row.date_naissance,
      dateEmbauche: row.date_embauche,
      poste: row.poste,
      departement: row.departement_nom,
      departementId: row.departement_id,
      statut: row.statut,
      salaireBrut: parseFloat(row.salaire_brut) || 0,
      email: row.email || '',
      telephone: row.telephone || '',
      adresse: row.adresse || '',
      nombreEnfants: row.nombre_enfants || 0,
      rib: row.rib || '',
    }));
  }

  static async getActifs() {
    return query('SELECT * FROM employes WHERE statut = "actif" OR statut = "conge"');
  }

  static async countByStatut() {
    return query(`
      SELECT statut, COUNT(*) as total 
      FROM employes 
      GROUP BY statut
    `);
  }
}

module.exports = Employe;
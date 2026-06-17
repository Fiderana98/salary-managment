const Employe = require('../models/Employe');

exports.getAllEmployes = async (req, res) => {
  try {
    const { statut, departementId, search } = req.query;
    const employes = await Employe.findAll({ statut, departementId, search });
    res.json(employes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des employés' });
  }
};

exports.getEmployeById = async (req, res) => {
  try {
    const employe = await Employe.findById(req.params.id);
    if (!employe) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    res.json(employe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.createEmploye = async (req, res) => {
  try {
    const employeData = {
      nom: req.body.nom,
      prenom: req.body.prenom,
      sexe: req.body.sexe,
      dateNaissance: req.body.dateNaissance,
      dateEmbauche: req.body.dateEmbauche,
      poste: req.body.poste,
      departementId: req.body.departementId || null,  // force null si absent
      secteur: req.body.secteur,
      categorie: req.body.categorie,
      statut: req.body.statut,
      salaireBrut: req.body.salaireBrut,
      email: req.body.email || null,
      telephone: req.body.telephone || null,
      adresse: req.body.adresse || null,
      nombreEnfants: req.body.nombreEnfants ?? 0,
      rib: req.body.rib || null,
    };
    // ... validation
    const employe = await Employe.create(employeData);
    res.status(201).json(employe);
  } catch (error) {
    console.error('Erreur création employé:', error);
    res.status(500).json({ error: `Erreur lors de la création: ${error.message}` });
  }
};

exports.updateEmploye = async (req, res) => {
  try {
    console.log('Données reçues pour mise à jour:', req.body);
    
    const employe = await Employe.findById(req.params.id);
    if (!employe) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    
    // Accepter les deux formats et construire l'objet progressivement
    const employeData = {};
    
    // Champs simples
    if (req.body.nom !== undefined) employeData.nom = req.body.nom;
    if (req.body.prenom !== undefined) employeData.prenom = req.body.prenom;
    if (req.body.sexe !== undefined) employeData.sexe = req.body.sexe;
    if (req.body.poste !== undefined) employeData.poste = req.body.poste;
    if (req.body.secteur !== undefined) employeData.secteur = req.body.secteur;
    if (req.body.categorie !== undefined) employeData.categorie = req.body.categorie;
    if (req.body.statut !== undefined) employeData.statut = req.body.statut;
    const salaireBrut = req.body.salaireBrut ?? req.body.salaire_brut;
    if (salaireBrut !== undefined) employeData.salaireBrut = salaireBrut;
    if (req.body.email !== undefined) employeData.email = req.body.email;
    if (req.body.telephone !== undefined) employeData.telephone = req.body.telephone;
    if (req.body.adresse !== undefined) employeData.adresse = req.body.adresse;
    if (req.body.nombreEnfants !== undefined) employeData.nombreEnfants = req.body.nombreEnfants;
    if (req.body.rib !== undefined) employeData.rib = req.body.rib;
    
    // Dates
    const dateNaissance = req.body.dateNaissance || req.body.date_naissance;
    const dateEmbauche = req.body.dateEmbauche || req.body.date_embauche;
    if (dateNaissance !== undefined) employeData.dateNaissance = dateNaissance;
    if (dateEmbauche !== undefined) employeData.dateEmbauche = dateEmbauche;
    
    // Département
    const departement = req.body.departement || req.body.departement_nom;
    const departementId = req.body.departementId || req.body.departement_id;
    if (departement !== undefined) employeData.departement = departement;
    if (departementId !== undefined) employeData.departementId = departementId;
    
    console.log('Données préparées pour mise à jour:', employeData);
    
    const updated = await Employe.update(req.params.id, employeData);
    res.json(updated);
  } catch (error) {
    console.error('Erreur mise à jour employé:', error);
    res.status(500).json({ error: `Erreur lors de la mise à jour: ${error.message}` });
  }
};

exports.deleteEmploye = async (req, res) => {
  try {
    const employe = await Employe.findById(req.params.id);
    if (!employe) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    
    await Employe.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Erreur suppression employé:', error);
    res.status(500).json({ error: `Erreur lors de la suppression: ${error.message}` });
  }
};

exports.getStatsEmployes = async (req, res) => {
  try {
    const stats = await Employe.countByStatut();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
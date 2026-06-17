const SalaireHistorique = require('../models/SalaireHistorique');
const Employe = require('../models/Employe');

exports.getHistorique = async (req, res) => {
  try {
    const { employeId } = req.params;
    const historique = await SalaireHistorique.findByEmployeId(employeId);
    res.json(historique);
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
};

exports.ajouterChangement = async (req, res) => {
  try {
    const { employeId } = req.params;
    const { typeChangement, nouveauSalaire, nouveauPoste, motif, periodeEffet } = req.body;

    if (!typeChangement || !['augmentation', 'promotion', 'retrogradation'].includes(typeChangement)) {
      return res.status(400).json({ error: 'Type de changement invalide' });
    }
    if (!nouveauSalaire && !nouveauPoste) {
      return res.status(400).json({ error: 'Au moins un nouveau salaire ou un nouveau poste est requis' });
    }
    if (!periodeEffet) {
      return res.status(400).json({ error: 'La période d\'effet est requise' });
    }

    const employe = await Employe.findById(employeId);
    if (!employe) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    const data = {
      employeId,
      typeChangement,
      ancienSalaire: employe.salaireBrut,
      nouveauSalaire: nouveauSalaire !== undefined ? nouveauSalaire : employe.salaireBrut,
      ancienPoste: employe.poste,
      nouveauPoste: nouveauPoste || employe.poste,
      motif: motif || '',
      periodeEffet,
    };

    const result = await SalaireHistorique.create(data);
    res.status(201).json(result);
  } catch (error) {
    console.error('Erreur ajout changement:', error);
    res.status(500).json({ error: `Erreur lors de l'ajout du changement: ${error.message}` });
  }
};
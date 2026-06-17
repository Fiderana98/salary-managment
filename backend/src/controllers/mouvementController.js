const Mouvement = require('../models/Mouvement');
const Employe = require('../models/Employe');

// Mapping type mouvement → statut employé
const TYPE_TO_STATUT = {
  suspension: 'suspendu',
  licenciement: 'depart',
  depart_retraite: 'depart',
  demission: 'depart',
};

// Types avec indemnité
const TYPES_AVEC_INDEMNITE = ['licenciement', 'depart_retraite'];

exports.getAll = async (req, res, next) => {
  try {
    const mouvements = await Mouvement.findAll(req.query);
    res.json(mouvements);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const mouvement = await Mouvement.findById(req.params.id);
    if (!mouvement) return res.status(404).json({ error: 'Mouvement non trouvé' });
    res.json(mouvement);
  } catch (err) {
    next(err);
  }
};

exports.getByEmploye = async (req, res, next) => {
  try {
    const { employeId } = req.params;
    const mouvements = await Mouvement.findAll({ employeId });
    res.json(mouvements);
  } catch (err) {
    next(err);
  }
};

exports.getActifsByEmploye = async (req, res, next) => {
  try {
    const { employeId } = req.params;
    const mouvements = await Mouvement.findActifsByEmploye(employeId);
    res.json(mouvements);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { employeId, type, motif, dateDebut, dateFin, indemnite, pourcentageRemuneration } = req.body;

    if (!employeId) return res.status(400).json({ error: 'employeId requis' });
    if (!type) return res.status(400).json({ error: 'Type de mouvement requis' });
    if (!motif) return res.status(400).json({ error: 'Motif requis' });
    if (!dateDebut) return res.status(400).json({ error: 'Date de début requise' });

    if (!['suspension', 'licenciement', 'depart_retraite', 'demission'].includes(type)) {
      return res.status(400).json({ error: 'Type de mouvement invalide' });
    }

    // Vérifier que l'employé existe
    const employe = await Employe.findById(employeId);
    if (!employe) return res.status(404).json({ error: 'Employé non trouvé' });

    // Vérifier les indemnités : seulement pour licenciement et départ retraite
    if (type === 'demission' && (indemnite && parseFloat(indemnite) > 0)) {
      return res.status(400).json({ error: 'Pas d\'indemnité pour une démission' });
    }

    // Créer le mouvement
    const mouvement = await Mouvement.create({
      employeId,
      type,
      motif,
      dateDebut,
      dateFin: dateFin || null,
      indemnite: TYPES_AVEC_INDEMNITE.includes(type) ? (indemnite || 0) : 0,
      pourcentageRemuneration: type === 'suspension' ? (pourcentageRemuneration || null) : null,
    });

    // Mettre à jour le statut de l'employé
    const nouveauStatut = TYPE_TO_STATUT[type];
    await Employe.update(employeId, { statut: nouveauStatut });

    res.status(201).json(mouvement);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const mouvement = await Mouvement.findById(req.params.id);
    if (!mouvement) return res.status(404).json({ error: 'Mouvement non trouvé' });

    const updated = await Mouvement.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.desactiver = async (req, res, next) => {
  try {
    const mouvement = await Mouvement.findById(req.params.id);
    if (!mouvement) return res.status(404).json({ error: 'Mouvement non trouvé' });

    const updated = await Mouvement.desactiver(req.params.id);

    // Si c'était une suspension, remettre l'employé en actif
    if (mouvement.type === 'suspension') {
      await Employe.update(mouvement.employeId, { statut: 'actif' });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const mouvement = await Mouvement.findById(req.params.id);
    if (!mouvement) return res.status(404).json({ error: 'Mouvement non trouvé' });
    await Mouvement.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.getRecents = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const mouvements = await Mouvement.getMouvementsRecents(limit);
    res.json(mouvements);
  } catch (err) {
    next(err);
  }
};
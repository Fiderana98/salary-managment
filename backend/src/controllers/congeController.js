const Conge = require('../models/Conge');
const Employe = require('../models/Employe');

exports.getAll = async (req, res, next) => {
  try {
    const conges = await Conge.findAll(req.query);
    res.json(conges);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const conge = await Conge.findById(req.params.id);
    if (!conge) return res.status(404).json({ error: 'Congé non trouvé' });
    res.json(conge);
  } catch (err) {
    next(err);
  }
};

exports.getByEmploye = async (req, res, next) => {
  try {
    const { employeId } = req.params;
    const conges = await Conge.findAll({ employeId });
    res.json(conges);
  } catch (err) {
    next(err);
  }
};

exports.getActifsByEmploye = async (req, res, next) => {
  try {
    const { employeId } = req.params;
    const conges = await Conge.findActifsByEmploye(employeId);
    res.json(conges);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { employeId, libelle, motif, dateDebut, dateFin, pourcentageRemuneration } = req.body;

    if (!employeId) return res.status(400).json({ error: 'employeId requis' });
    if (!libelle) return res.status(400).json({ error: 'Libellé du congé requis' });
    if (!dateDebut) return res.status(400).json({ error: 'Date de début requise' });
    if (!dateFin) return res.status(400).json({ error: 'Date de fin requise' });

    if (new Date(dateFin) < new Date(dateDebut)) {
      return res.status(400).json({ error: 'La date de fin doit être après la date de début' });
    }

    // Vérifier que l'employé existe
    const employe = await Employe.findById(employeId);
    if (!employe) return res.status(404).json({ error: 'Employé non trouvé' });

    const conge = await Conge.create({
      employeId,
      libelle,
      motif: motif || null,
      dateDebut,
      dateFin,
      pourcentageRemuneration: pourcentageRemuneration ?? 100.00,
    });

    // Mettre l'employé en statut 'conge'
    await Employe.update(employeId, { statut: 'conge' });

    res.status(201).json(conge);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const conge = await Conge.findById(req.params.id);
    if (!conge) return res.status(404).json({ error: 'Congé non trouvé' });

    const updated = await Conge.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.desactiver = async (req, res, next) => {
  try {
    const conge = await Conge.findById(req.params.id);
    if (!conge) return res.status(404).json({ error: 'Congé non trouvé' });

    const updated = await Conge.desactiver(req.params.id);

    // Remettre l'employé en actif
    await Employe.update(conge.employeId, { statut: 'actif' });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const conge = await Conge.findById(req.params.id);
    if (!conge) return res.status(404).json({ error: 'Congé non trouvé' });
    await Conge.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
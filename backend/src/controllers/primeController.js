const Prime = require('../models/Prime');

exports.getAll = async (req, res, next) => {
  try {
    const primes = await Prime.findAll();
    res.json(primes);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const prime = await Prime.findById(req.params.id);
    if (!prime) return res.status(404).json({ error: 'Prime non trouvée' });
    res.json(prime);
  } catch (err) {
    next(err);
  }
};

exports.getByEmploye = async (req, res, next) => {
  try {
    const { employeId, periode } = req.query;
    if (!employeId) return res.status(400).json({ error: 'employeId requis' });
    const primes = await Prime.findByEmploye(employeId, periode || new Date().toISOString().split('T')[0]);
    res.json(primes);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { libelle, type, cible, employeId, departementId, mode, valeur, imposable, actif, dateDebut, dateFin, description } = req.body;
    if (!libelle) return res.status(400).json({ error: 'Le libellé est requis' });
    if (!type || !['ciblee', 'automatique'].includes(type)) return res.status(400).json({ error: 'Type invalide (ciblee ou automatique)' });
    if (type === 'ciblee' && (!cible || !['personne', 'departement', 'tous'].includes(cible))) {
      return res.status(400).json({ error: 'Cible invalide pour une prime ciblée' });
    }
    if (type === 'ciblee' && cible === 'personne' && !employeId) {
      return res.status(400).json({ error: 'employeId requis pour une prime ciblée personne' });
    }
    if (type === 'ciblee' && cible === 'departement' && !departementId) {
      return res.status(400).json({ error: 'departementId requis pour une prime ciblée département' });
    }
    if (!mode || !['taux', 'fixe'].includes(mode)) return res.status(400).json({ error: 'Mode invalide (taux ou fixe)' });
    if (!valeur || valeur <= 0) return res.status(400).json({ error: 'La valeur doit être positive' });

    const prime = await Prime.create({
      libelle, type, cible: type === 'automatique' ? null : cible,
      employeId: type === 'automatique' ? null : (cible === 'personne' ? employeId : null),
      departementId: type === 'automatique' ? null : (cible === 'departement' ? departementId : null),
      mode, valeur, imposable: imposable !== undefined ? imposable : true, actif, dateDebut, dateFin, description,
    });
    res.status(201).json(prime);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const prime = await Prime.findById(req.params.id);
    if (!prime) return res.status(404).json({ error: 'Prime non trouvée' });
    const updated = await Prime.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.toggleActif = async (req, res, next) => {
  try {
    const prime = await Prime.findById(req.params.id);
    if (!prime) return res.status(404).json({ error: 'Prime non trouvée' });
    const updated = await Prime.update(req.params.id, { actif: !prime.actif });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const prime = await Prime.findById(req.params.id);
    if (!prime) return res.status(404).json({ error: 'Prime non trouvée' });
    await Prime.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
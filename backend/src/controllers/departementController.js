const Departement = require('../models/Departement');

exports.getAllDepartements = async (req, res) => {
  try {
    const departements = await Departement.findAll();
    res.json(departements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDepartementById = async (req, res) => {
  try {
    const departement = await Departement.findById(req.params.id);
    if (!departement) return res.status(404).json({ error: 'Département non trouvé' });
    res.json(departement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createDepartement = async (req, res) => {
  try {
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ error: 'Le nom est requis' });
    const departement = await Departement.create(nom);
    res.status(201).json(departement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDepartement = async (req, res) => {
  try {
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ error: 'Le nom est requis' });
    const departement = await Departement.update(req.params.id, nom);
    res.json(departement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDepartement = async (req, res) => {
  try {
    await Departement.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
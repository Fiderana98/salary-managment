const Parametres = require('../models/Parametres');

exports.getParametres = async (req, res) => {
  try {
    const parametres = await Parametres.get();
    if (!parametres) {
      // Créer des paramètres par défaut si inexistants
      const { parametresDefaut } = require('../data/parametresDefaut');
      await Parametres.update(parametresDefaut);
      const newParametres = await Parametres.get();
      return res.json(newParametres);
    }
    res.json(parametres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres' });
  }
};

exports.updateParametres = async (req, res) => {
  try {
    const parametres = await Parametres.update(req.body);
    res.json(parametres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

exports.resetParametres = async (req, res) => {
  try {
    const { parametresDefaut: parametresParDefaut } = require('../data/parametresDefaut');
    
    const parametres = await Parametres.update(parametresParDefaut);
    res.json(parametres);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
};
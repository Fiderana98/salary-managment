const Bulletin = require('../models/Bulletin');

exports.getAllBulletins = async (req, res) => {
  try {
    const { periode, statut, employeId } = req.query;
    const bulletins = await Bulletin.findAll({ periode, statut, employeId });
    res.json(bulletins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des bulletins' });
  }
};

exports.getBulletinById = async (req, res) => {
  try {
    const bulletin = await Bulletin.findById(req.params.id);
    if (!bulletin) {
      return res.status(404).json({ error: 'Bulletin non trouvé' });
    }
    res.json(bulletin);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.genererBulletins = async (req, res) => {
  try {
    const { periode, force } = req.body;
    
    if (!periode) {
      return res.status(400).json({ error: 'La période est requise' });
    }
    
    if (!/^\d{4}-\d{2}$/.test(periode)) {
      return res.status(400).json({ error: 'Format de période invalide. Utilisez YYYY-MM' });
    }
    
    // Vérifier d'abord si les bulletins existent
    const existingBulletins = await Bulletin.findAll({ periode });
    
    if (existingBulletins && existingBulletins.length > 0) {
      // Si force n'est pas true, retourner une erreur 400 (pas 500)
      if (force !== true) {
        return res.status(400).json({ 
          error: `Les bulletins pour la période ${periode} existent déjà.`,
          code: 'BULLETINS_EXISTANTS'
        });
      }
      
      // Si force est true, supprimer les bulletins existants
      console.log(`Suppression des bulletins existants pour ${periode} (force=true)`);
      await Bulletin.deleteByPeriode(periode);
    }
    
    const resultats = await Bulletin.genererPourPeriode(periode);
    res.status(201).json(resultats);
  } catch (error) {
    console.error('Erreur génération bulletins:', error);
    res.status(500).json({ error: `Erreur lors de la génération: ${error.message}` });
  }
};

exports.validerBulletin = async (req, res) => {
  try {
    const bulletin = await Bulletin.updateStatut(req.params.id, 'valide', 'validation');
    if (!bulletin) {
      return res.status(404).json({ error: 'Bulletin non trouvé' });
    }
    res.json(bulletin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la validation' });
  }
};

exports.payerBulletin = async (req, res) => {
  try {
    const bulletin = await Bulletin.updateStatut(req.params.id, 'paye', 'paiement');
    if (!bulletin) {
      return res.status(404).json({ error: 'Bulletin non trouvé' });
    }
    res.json(bulletin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du paiement' });
  }
};

exports.getStatsBulletins = async (req, res) => {
  try {
    const stats = await Bulletin.getStatsParPeriode();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
const Bulletin = require('../models/Bulletin');
const Employe = require('../models/Employe');

exports.getRapportGlobal = async (req, res) => {
  try {
    // Statistiques employés
    const employes = await Employe.findAll();
    const actifs = employes.filter(e => e.statut === 'actif').length;
    const masseSalariale = employes
      .filter(e => e.statut === 'actif')
      .reduce((sum, e) => sum + e.salaireBrut, 0);
    
    // Statistiques bulletins
    const bulletins = await Bulletin.getStatsParPeriode();
    const totalBulletins = bulletins.reduce((sum, b) => sum + b.total_bulletins, 0);
    const totalNet = bulletins.reduce((sum, b) => sum + b.total_masse_salariale, 0);
    const totalBrut = bulletins.reduce((sum, b) => sum + (b.total_brut || 0), 0);
    
    res.json({
      employes: {
        total: employes.length,
        actifs,
        masseSalariale,
        salaireMoyen: actifs > 0 ? masseSalariale / actifs : 0,
      },
      paie: {
        totalBulletins,
        totalNet,
        totalBrut,
      },
      tendances: bulletins.slice(0, 12),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la génération du rapport' });
  }
};

exports.getRapportParDepartement = async (req, res) => {
  try {
    const employes = await Employe.findAll();
    const stats = {};
    
    for (const e of employes.filter(e => e.statut === 'actif')) {
      const dept = e.departement || 'Non assigné';
      if (!stats[dept]) {
        stats[dept] = { total: 0, count: 0, salaires: [] };
      }
      stats[dept].total += e.salaireBrut;
      stats[dept].count++;
      stats[dept].salaires.push(e.salaireBrut);
    }
    
    const result = Object.entries(stats).map(([dept, data]) => ({
      departement: dept,
      effectif: data.count,
      masseSalariale: data.total,
      salaireMoyen: data.total / data.count,
      salaireMin: Math.min(...data.salaires),
      salaireMax: Math.max(...data.salaires),
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
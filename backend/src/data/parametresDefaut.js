const parametresDefaut = {
  sme_non_agricole: 262680,
  sme_agricole: 266500,
  plafond_multiplier: 8,
  cnaps_salarial: 0.01,
  ostie_salariale: 0.01,
  heures_travail_mensuel: 173.33,
  taux_heure_supplementaire: 1.3,
  tranches_irsa: [
    { min: 0, max: 350000, taux: 0 },
    { min: 350000, max: 400000, taux: 0.05 },
    { min: 400000, max: 500000, taux: 0.10 },
    { min: 500000, max: 600000, taux: 0.15 },
    { min: 600000, max: 800000, taux: 0.20 },
    { min: 800000, max: null, taux: 0.25 },
  ],
};

module.exports = { parametresDefaut };

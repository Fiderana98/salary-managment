class CalculPaie {
  static calculer(employe, periode, parametres, options = {}) {
    const {
      heuresSup = 0,
      autresPrimes = [],
    } = options;

    const salaireBrut = Number(employe.salaireBrut) || 0;

    // Heures supplémentaires
    const heuresMensuelles = Number(parametres.heures_travail_mensuel) || 173.33;
    const tauxHoraire = salaireBrut / heuresMensuelles;
    const montantHeuresSup = heuresSup * tauxHoraire * (Number(parametres.taux_heure_supplementaire) || 1.3);

    // Séparer les primes imposables et non imposables
    const primesImposables = autresPrimes
      .filter(p => p.imposable !== false)
      .reduce((s, p) => s + (Number(p.montant) || 0), 0);
    const primesNonImposables = autresPrimes
      .filter(p => p.imposable === false)
      .reduce((s, p) => s + (Number(p.montant) || 0), 0);

    const totalBrut = salaireBrut + montantHeuresSup + primesImposables + primesNonImposables;

    // Cotisations salariales calculées sur la base : salaire brut + heures sup + primes imposables
    const baseCotisations = salaireBrut + montantHeuresSup + primesImposables;
    const cnaps_salarial = baseCotisations * (Number(parametres.cnaps_salarial) || 0.01);
    const ostie_salariale = baseCotisations * (Number(parametres.ostie_salariale) || 0.01);
    const totalCotisationsSalariales = cnaps_salarial + ostie_salariale;

    // Base imposable IRSA = base cotisations - cotisations sociales
    const baseImposable = baseCotisations - totalCotisationsSalariales;
    const irsa = this.calculerIRSA(baseImposable, parametres.tranches_irsa || []);

    const salaireNet = totalBrut - totalCotisationsSalariales - irsa;

    return {
      employeId: employe.id,
      periode,
      salaireBrut,
      heuresSupplementaires: heuresSup,
      montantHeuresSup,
      primeTransport: 0,
      primeAnciennete: 0,
      autresPrimes,
      totalBrut,
      baseImposable,
      cnaps_salarial,
      ostie_salariale,
      totalCotisationsSalariales,
      irsa,
      salaireNet,
    };
  }

  static calculerIRSA(base, tranches) {
    if (!tranches || tranches.length === 0 || base <= 0) {
      return 0;
    }

    const plancher = 350000;
    const forfait = 3000;

    if (base <= plancher) {
      return forfait;
    }

    // Trouver le taux applicable selon les tranches
    let taux = 0;
    for (const tranche of tranches) {
      const min = Number(tranche.min) || 0;
      const max = tranche.max === null || tranche.max === undefined ? Infinity : Number(tranche.max);
      if (base > min && base <= max) {
        taux = Number(tranche.taux) || 0;
        break;
      }
    }

    if (taux === 0 && tranches.length > 0) {
      const derniere = tranches[tranches.length - 1];
      if (derniere.max === null || base > Number(derniere.max)) {
        taux = Number(derniere.taux) || 0;
      }
    }

    const impot = (base - plancher) * taux + forfait;
    return Math.round(impot);
  }

  static genererMatricule(employes) {
    const maxMatricule = employes.reduce((max, e) => {
      const num = parseInt(e.matricule?.slice(-4) || '0');
      return num > max ? num : max;
    }, 0);
    return `EMP${String(maxMatricule + 1).padStart(4, '0')}`;
  }
}

module.exports = CalculPaie;
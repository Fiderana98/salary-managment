// ─── Thème ───────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark';

// ─── Employé ─────────────────────────────────────────────────────────────────
export type Sexe = 'M' | 'F';
export type Statut = 'actif' | 'conge' | 'suspendu' | 'depart';
export interface Employe {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: Sexe;
  dateNaissance: string;
  dateEmbauche: string;
  poste: string;
  departement: string;
  departementId?: string;
  statut: Statut;
  salaireBrut: number;
  email: string;
  telephone: string;
  adresse: string;
  nombreEnfants: number;
  rib: string;
}

// ─── Paramètres de paie ──────────────────────────────────────────────────────
export interface ParametresPaie {
  // SME
  sme_non_agricole: number;
  sme_agricole: number;
  plafond_multiplier: number;

  // CNaPS / OSTIE
  cnaps_salarial: number;         // 1%
  cnaps_patronal: number;         // 13%
  ostie_salariale: number;        // 1%
  ostie_patronale: number;        // 5%
  fmfp_patronal: number;          // 1%

  // IRSA – tranches
  tranches_irsa: TrancheIrsa[];

  // Autres
  heures_travail_mensuel: number; // 173.33
  taux_heure_supplementaire: number; // 130% par défaut
  prime_anciennete_taux: number;
  prime_transport_defaut: number;
}

export interface TrancheIrsa {
  min: number;
  max: number | null;
  taux: number;
}

// ─── Bulletin de paie ────────────────────────────────────────────────────────
export interface BulletinPaie {
  id: string;
  employeId: string;
  periode: string; // "2024-06"
  salaireBrut: number;
  heuresSupplementaires: number;
  montantHeuresSup: number;
  primeTransport: number;
  primeAnciennete: number;
  autresPrimes: PrimeSupplémentaire[];
  totalBrut: number;
  // Cotisations salariales
  cnaps_salarial: number;
  ostie_salariale: number;
  totalCotisationsSalariales: number;
  // IRSA
  irsa: number;
  // Net
  salaireNet: number;
  // Statut
  statut: 'brouillon' | 'valide' | 'paye';
  dateCreation: string;
  dateValidation?: string;
  datePaiement?: string;
}

export interface PrimeSupplémentaire {
  libelle: string;
  montant: number;
  imposable: boolean;
}

// ─── Gestion des Primes (Bonus) ──────────────────────────────────────────────
export type PrimeType = 'ciblee' | 'automatique';
export type PrimeCible = 'personne' | 'departement' | 'tous';
export type PrimeMode = 'taux' | 'fixe';

export interface Prime {
  id: string;
  libelle: string;
  type: PrimeType;
  cible: PrimeCible | null;        // null si automatique
  employeId: string | null;        // si cible = 'personne'
  departementId: string | null;    // si cible = 'departement'
  mode: PrimeMode;                 // 'taux' ou 'fixe'
  valeur: number;                  // ex: 5 pour 5% ou 50000 Ar
  imposable: boolean;              // true = soumis à cotisations et IRSA, false = exonéré
  actif: boolean;
  dateDebut: string;
  dateFin: string | null;
  description: string;
  creeLe: string;
}

// ─── Département ─────────────────────────────────────────────────────────────
export interface Departement {
  id: string;
  nom: string;
  responsable: string;
  budget: number;
}

// ─── Notification ────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  titre: string;
  message: string;
  date: string;
  lu: boolean;
}

// ─── Stats ───────────────────────────────────────────────────────────────────
export interface StatsMensuelles {
  periode: string;
  masseSalariale: number;
  nombreEmployes: number;
  bulletinsPaies: number;
}

// ─── Mouvements (suspension, licenciement, départ, démission) ─
export type MouvementType = 'suspension' | 'licenciement' | 'depart_retraite' | 'demission';

export interface Mouvement {
  id: string;
  employeId: string;
  type: MouvementType;
  motif: string;
  dateDebut: string;
  dateFin: string | null;
  indemnite: number;
  pourcentageRemuneration: number | null;
  actif: boolean;
  creeLe: string;
  modifieLe: string;
  employeNom?: string;
  employeMatricule?: string;
}

export interface Conge {
  id: string;
  employeId: string;
  libelle: string;
  motif: string | null;
  dateDebut: string;
  dateFin: string;
  pourcentageRemuneration: number;
  actif: boolean;
  creeLe: string;
  modifieLe: string;
  employeNom?: string;
  employeMatricule?: string;
}

// ─── Historique des salaires ──────────────────────────────────
export type TypeChangementSalaire = 'augmentation' | 'promotion' | 'retrogradation';

export interface ChangementSalaire {
  id: string;
  employeId: string;
  typeChangement: TypeChangementSalaire;
  ancienSalaire: number;
  nouveauSalaire: number;
  ancienPoste: string | null;
  nouveauPoste: string | null;
  motif: string;
  periodeEffet: string;
  creeLe: string;
}

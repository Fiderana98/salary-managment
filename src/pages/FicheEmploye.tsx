import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { formatAriary, formatDate, calculerAnciennete, formatPeriode } from '../utils/format';
import { ChangementSalaire, TypeChangementSalaire, Mouvement, Conge, MouvementType } from '../types';
import Card, { CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const getPeriodesDisponibles = (): string[] => {
  const periodes: string[] = [];
  const aujourdHui = new Date();
  const anneeActuelle = aujourdHui.getFullYear();
  const moisActuel = aujourdHui.getMonth() + 1;
  for (let i = 0; i < 12; i++) {
    let annee = anneeActuelle;
    let mois = moisActuel - i;
    if (mois < 1) { mois += 12; annee -= 1; }
    periodes.push(`${annee}-${mois.toString().padStart(2, '0')}`);
  }
  return periodes;
};

const configChangement: Record<TypeChangementSalaire, { label: string; variant: 'success' | 'info' | 'danger'; icon: string }> = {
  augmentation: { label: 'Augmentation', variant: 'success', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  promotion: { label: 'Promotion', variant: 'info', icon: 'M5 10l7-7m0 0l7 7m-7-7v18' },
  retrogradation: { label: 'Rétrogradation', variant: 'danger', icon: 'M19 14l-7 7m0 0l-7-7m7 7V3' },
};

const configMouvement: Record<MouvementType, { label: string; variant: 'warning' | 'danger' | 'neutral' | 'info'; icon: string; description: string }> = {
  suspension: { label: 'Suspension', variant: 'warning', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', description: 'Suspendre temporairement' },
  licenciement: { label: 'Licenciement', variant: 'danger', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', description: 'Licenciement avec indemnité' },
  depart_retraite: { label: 'Départ retraite', variant: 'neutral', icon: 'M5 13l4 4L19 7', description: 'Départ à la retraite avec indemnité' },
  demission: { label: 'Démission', variant: 'info', icon: 'M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', description: 'Démission sans indemnité' },
};

export default function FicheEmploye() {
  const { currentEmployeId, getEmploye, getBulletinsEmploye, setCurrentPage, refreshEmployes } = useApp();
  const employe = currentEmployeId ? getEmploye(currentEmployeId) : null;
  const bulletins = currentEmployeId ? getBulletinsEmploye(currentEmployeId) : [];
  
  const [modalChangementOpen, setModalChangementOpen] = useState(false);
  const [modalMouvementOpen, setModalMouvementOpen] = useState(false);
  const [modalCongeOpen, setModalCongeOpen] = useState(false);
  const [historiqueSalaires, setHistoriqueSalaires] = useState<ChangementSalaire[]>([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [conges, setConges] = useState<Conge[]>([]);
  const [loadingMouvements, setLoadingMouvements] = useState(false);
  const [loadingConges, setLoadingConges] = useState(false);

  // Formulaire changement de salaire
  const [changementForm, setChangementForm] = useState({
    typeChangement: 'augmentation' as TypeChangementSalaire,
    nouveauSalaire: 0,
    nouveauPoste: '',
    motif: '',
    periodeEffet: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Formulaire mouvement
  const [mouvementForm, setMouvementForm] = useState({
    type: 'suspension' as MouvementType,
    motif: '',
    dateDebut: '',
    dateFin: '',
    indemnite: 0,
    pourcentageRemuneration: 50,
  });
  const [submittingMouvement, setSubmittingMouvement] = useState(false);
  const [showIndemnite, setShowIndemnite] = useState(false);
  const [showPctRemun, setShowPctRemun] = useState(false);

  // Formulaire congé
  const [congeForm, setCongeForm] = useState({
    libelle: '',
    motif: '',
    dateDebut: '',
    dateFin: '',
    pourcentageRemuneration: 100,
  });
  const [submittingConge, setSubmittingConge] = useState(false);

  const periodesList = getPeriodesDisponibles();

  // Charger les données
  useEffect(() => {
    if (currentEmployeId) {
      setLoadingHistorique(true);
      setLoadingMouvements(true);
      setLoadingConges(true);

      api.getHistoriqueSalaire(currentEmployeId)
        .then(data => {
          // Ensure legacy type values are normalized
          const normalized = data.map((h: any) => ({
            ...h,
            typeChangement: h.typeChangement === 'retrogradation' ? 'retrogradation' : h.typeChangement,
          }));
          setHistoriqueSalaires(normalized);
        })
        .catch(() => {})
        .finally(() => setLoadingHistorique(false));

      api.getMouvementsByEmploye(currentEmployeId)
        .then(data => setMouvements(data))
        .catch(() => {})
        .finally(() => setLoadingMouvements(false));

      api.getCongesByEmploye(currentEmployeId)
        .then(data => setConges(data))
        .catch(() => {})
        .finally(() => setLoadingConges(false));
    }
  }, [currentEmployeId]);

  const handleSubmitMouvement = async () => {
    if (!employe || !currentEmployeId) return;
    // Le champ "motif" est obligatoire sauf pour le départ retraite, où il peut être optionnel
    if (mouvementForm.type !== 'depart_retraite' && !mouvementForm.motif) {
      toast.error('Veuillez saisir un motif');
      return;
    }
    if (!mouvementForm.dateDebut) { toast.error('Veuillez sélectionner une date de début'); return; }

    setSubmittingMouvement(true);
    try {
      const data: any = {
        employeId: currentEmployeId,
        type: mouvementForm.type,
        motif: mouvementForm.motif,
        dateDebut: mouvementForm.dateDebut,
      };

      if (mouvementForm.dateFin) data.dateFin = mouvementForm.dateFin;
      if (showIndemnite && mouvementForm.indemnite > 0) data.indemnite = mouvementForm.indemnite;
      if (showPctRemun) data.pourcentageRemuneration = mouvementForm.pourcentageRemuneration;

      await api.createMouvement(data);
      toast.success(`${configMouvement[mouvementForm.type].label} enregistrée`);
      setModalMouvementOpen(false);
      await refreshEmployes();
      const m = await api.getMouvementsByEmploye(currentEmployeId);
      setMouvements(m);
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmittingMouvement(false);
    }
  };

  // Ouvrir modal congé
  const openCongeModal = () => {
    if (!employe) return;
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    setCongeForm({
      libelle: '',
      motif: '',
      dateDebut: today,
      dateFin: nextWeek,
      pourcentageRemuneration: 100,
    });
    setModalCongeOpen(true);
  };

  // Ouvrir le modal de mouvement (création ou édition)
  const openMouvementModal = (typeOrEdit: MouvementType | 'edit', data?: Mouvement) => {
    // Réinitialiser les flags d'affichage
    setShowIndemnite(false);
    setShowPctRemun(false);

    if (typeOrEdit === 'edit' && data) {
      // Mode édition : préremplir le formulaire avec les données du mouvement
      setMouvementForm({
        type: data.type as MouvementType,
        motif: data.motif,
        dateDebut: data.dateDebut?.split('T')[0] || '',
        dateFin: data.dateFin?.split('T')[0] || '',
        indemnite: data.indemnite ?? 0,
        pourcentageRemuneration: data.pourcentageRemuneration ?? 50,
      });
      // Afficher les champs spécifiques selon le type
      if (data.type === 'licenciement' || data.type === 'depart_retraite') setShowIndemnite(true);
      if (data.type === 'suspension') setShowPctRemun(true);
    } else {
      // Mode création : initialiser le formulaire avec le type demandé
      const type = typeOrEdit as MouvementType;
      setMouvementForm({
        type,
        motif: '',
        dateDebut: '',
        dateFin: '',
        indemnite: 0,
        pourcentageRemuneration: 50,
      });
      if (type === 'licenciement' || type === 'depart_retraite') setShowIndemnite(true);
      if (type === 'suspension') setShowPctRemun(true);
    }
    setModalMouvementOpen(true);
  };

  const handleSubmitConge = async () => {
    if (!employe || !currentEmployeId) return;
    if (!congeForm.libelle) { toast.error('Veuillez saisir un libellé'); return; }
    if (!congeForm.dateDebut) { toast.error('Veuillez sélectionner une date de début'); return; }
    if (!congeForm.dateFin) { toast.error('Veuillez sélectionner une date de fin'); return; }

    if (new Date(congeForm.dateFin) < new Date(congeForm.dateDebut)) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    setSubmittingConge(true);
    try {
      await api.createConge({
        employeId: currentEmployeId,
        libelle: congeForm.libelle,
        motif: congeForm.motif || undefined,
        dateDebut: congeForm.dateDebut,
        dateFin: congeForm.dateFin,
        pourcentageRemuneration: congeForm.pourcentageRemuneration,
      });
      toast.success('Congé enregistré');
      setModalCongeOpen(false);
      await refreshEmployes();
      const c = await api.getCongesByEmploye(currentEmployeId);
      setConges(c);
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmittingConge(false);
    }
  };

  // Désactiver mouvement
  const handleDesactiverMouvement = async (id: string) => {
    try {
      await api.desactiverMouvement(id);
      toast.success('Mouvement désactivé');
      await refreshEmployes();
      if (currentEmployeId) {
        const m = await api.getMouvementsByEmploye(currentEmployeId);
        setMouvements(m);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erreur');
    }
  };

  // Désactiver congé
  const handleDesactiverConge = async (id: string) => {
    try {
      await api.desactiverConge(id);
      toast.success('Congé désactivé');
      await refreshEmployes();
      if (currentEmployeId) {
        const c = await api.getCongesByEmploye(currentEmployeId);
        setConges(c);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erreur');
    }
  };

  // Ouvrir modal changement
  const openChangementModal = (type: TypeChangementSalaire) => {
    if (!employe) return;
    setChangementForm({
      typeChangement: type,
      nouveauSalaire: employe.salaireBrut,
      nouveauPoste: employe.poste,
      motif: '',
      periodeEffet: periodesList[0] || '',
    });
    setModalChangementOpen(true);
  };

  // Ouvrir le modal d'édition d'un congé existant
  const openCongeModalEdit = (c: Conge) => {
    setCongeForm({
      libelle: c.libelle,
      motif: c.motif || '',
      dateDebut: c.dateDebut?.split('T')[0] || '',
      dateFin: c.dateFin?.split('T')[0] || '',
      pourcentageRemuneration: c.pourcentageRemuneration ?? 100,
    });
    setModalCongeOpen(true);
  };

  const handleSubmitChangement = async () => {
    if (!employe || !currentEmployeId) return;
    if (!changementForm.periodeEffet) {
      toast.error('Veuillez sélectionner une période d\'effet');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.ajouterChangementSalaire(currentEmployeId, {
        typeChangement: changementForm.typeChangement,
        nouveauSalaire: changementForm.nouveauSalaire,
        nouveauPoste: changementForm.nouveauPoste || employe.poste,
        motif: changementForm.motif,
        periodeEffet: changementForm.periodeEffet,
      });
      
      toast.success(`${configChangement[changementForm.typeChangement].label} enregistrée avec succès`);
      setModalChangementOpen(false);
      await refreshEmployes();
      const data = await api.getHistoriqueSalaire(currentEmployeId);
      setHistoriqueSalaires(data);
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  if (!employe) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-slate-400">Aucun employé sélectionné.</p>
        <Button className="mt-4" variant="secondary" onClick={() => setCurrentPage('employes')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const chartData = bulletins.slice(-6).map(b => ({
    mois: formatPeriode(b.periode).split(' ')[0].slice(0, 3),
    net: b.salaireNet,
    brut: b.totalBrut,
  }));

  const statutConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
    actif: { label: 'Actif', variant: 'success' },
    conge: { label: 'Congé', variant: 'warning' },
    suspendu: { label: 'Suspendu', variant: 'danger' },
    depart: { label: 'Départ', variant: 'neutral' },
  };

  const sc = statutConfig[employe.statut];

  const mouvementBadgeVariant: Record<string, 'warning' | 'danger' | 'neutral' | 'info' | 'success'> = {
    suspension: 'warning',
    licenciement: 'danger',
    depart_retraite: 'neutral',
    demission: 'info',
  };

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => setCurrentPage('employes')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour à la liste des employés
      </button>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 text-xl font-bold">
              {employe.prenom[0]}{employe.nom[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{employe.nom} {employe.prenom}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{employe.poste} — {employe.departement}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{employe.matricule}</p>
                </div>
                <Badge variant={sc.variant} dot>{sc.label}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Date d'embauche", value: formatDate(employe.dateEmbauche) },
                  { label: 'Ancienneté', value: calculerAnciennete(employe.dateEmbauche) },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Rémunération + Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full">
            <CardHeader title="Rémunération" subtitle="Salaire brut de base" icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            } />
            <div className="space-y-3">
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-3">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Salaire brut</p>
                <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">{formatAriary(employe.salaireBrut)}</p>
              </div>

              {/* Actions - Changements de salaire */}
              <div className="border-t border-slate-100 dark:border-slate-700/60 pt-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Salaire</p>
                <div className="flex flex-col gap-1.5">
                  <Button size="sm" variant="success" onClick={() => openChangementModal('augmentation')} icon={
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  }>Augmentation</Button>
                  <Button size="sm" variant="secondary" onClick={() => openChangementModal('promotion')} icon={
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  }>Promotion</Button>
                  <Button size="sm" variant="danger" onClick={() => openChangementModal('retrogradation')} icon={
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  }>Rétrogradation</Button>
                </div>
              </div>

              {/* Actions - Mouvements */}
              <div className="border-t border-slate-100 dark:border-slate-700/60 pt-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mouvements</p>
                <div className="flex flex-col gap-1.5">
                  <Button size="sm" variant="warning" onClick={() => openMouvementModal('suspension')} icon={
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  }>Suspendre</Button>
                  <Button size="sm" variant="danger" onClick={() => openMouvementModal('licenciement')} icon={
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  }>Licencier</Button>
                  <Button size="sm" variant="neutral" onClick={() => openMouvementModal('depart_retraite')} icon={
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  }>Départ retraite</Button>
                  <Button size="sm" variant="info" onClick={() => openMouvementModal('demission')} icon={
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  }>Démission</Button>
                </div>
              </div>

              {/* Actions - Congés */}
              <div className="border-t border-slate-100 dark:border-slate-700/60 pt-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Congés</p>
                <Button size="sm" variant="secondary" onClick={openCongeModal} icon={
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                }>Ajouter un congé</Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Contact */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="h-full">
            <CardHeader title="Coordonnées" icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            } />
            <div className="space-y-3">
              {[
                { label: 'Email', value: employe.email || '—', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                { label: 'Téléphone', value: employe.telephone || '—', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
                { label: 'Adresse', value: employe.adresse || '—', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
                { label: 'RIB', value: employe.rib || '—', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
              ].map(row => (
                <div key={row.label} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-400">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={row.icon} /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">{row.label}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Infos personnelles */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader title="Informations personnelles" icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            } />
            <div className="space-y-3">
              {[
                { label: 'Sexe', value: employe.sexe === 'M' ? 'Masculin' : 'Féminin' },
                { label: 'Date de naissance', value: formatDate(employe.dateNaissance) },
                { label: "Nombre d'enfants", value: `${employe.nombreEnfants}` },
                { label: 'Bulletins de paie', value: `${bulletins.length} générés` },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/40 last:border-0">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{row.label}</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Mouvements récents */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader
            title="Mouvements"
            subtitle={mouvements.length > 0 ? `${mouvements.length} mouvement(s)` : 'Aucun mouvement'}
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          {loadingMouvements ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          ) : mouvements.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucun mouvement enregistré pour cet employé.</p>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60">
                    {['Type', 'Motif', 'Date début', 'Date fin', 'Indemnité', '% Rémun.', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {mouvements.map((m, i) => {
                      const cfg = configMouvement[m.type as MouvementType] || configMouvement.suspension;
                      return (
                        <motion.tr
                          key={m.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-slate-100 dark:border-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-2.5">
                            <Badge variant={mouvementBadgeVariant[m.type] || 'neutral'}>{cfg.label}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 max-w-40 truncate">{m.motif}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(m.dateDebut)}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{m.dateFin ? formatDate(m.dateFin) : '—'}</td>
                          <td className="px-4 py-2.5 text-xs tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">{m.indemnite > 0 ? formatAriary(m.indemnite) : '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{m.pourcentageRemuneration ? `${m.pourcentageRemuneration}%` : '—'}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant={m.actif ? 'warning' : 'neutral'}>{m.actif ? 'Actif' : 'Inactif'}</Badge>
                          </td>
                          <td className="px-4 py-2.5">
                          {m.actif && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => openMouvementModal('edit', m)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                title="Modifier"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDesactiverMouvement(m.id)}
                                className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Désactiver"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Congés */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader
            title="Congés"
            subtitle={conges.length > 0 ? `${conges.length} congé(s)` : 'Aucun congé'}
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          {loadingConges ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          ) : conges.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucun congé enregistré pour cet employé.</p>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60">
                    {['Libellé', 'Motif', 'Début', 'Fin', '% Rémun.', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {conges.map((c, i) => (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-slate-100 dark:border-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{c.libelle}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 max-w-40 truncate">{c.motif || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(c.dateDebut)}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(c.dateFin)}</td>
                        <td className="px-4 py-2.5 text-xs tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">{c.pourcentageRemuneration}%</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={c.actif ? 'success' : 'neutral'}>{c.actif ? 'Actif' : 'Inactif'}</Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          {c.actif && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => openCongeModalEdit(c)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                title="Modifier"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDesactiverConge(c.id)}
                                className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Désactiver"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Historique des changements de salaire */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card>
          <CardHeader
            title="Historique des salaires"
            subtitle={historiqueSalaires.length > 0 ? `${historiqueSalaires.length} changement(s)` : 'Aucun changement enregistré'}
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          {loadingHistorique ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          ) : historiqueSalaires.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucun changement de salaire enregistré pour cet employé.</p>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60">
                    {['Date', 'Type', 'Ancien salaire', 'Nouveau salaire', 'Ancien poste', 'Nouveau poste', 'Motif'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {historiqueSalaires.map((h, i) => {
                      const cfg = configChangement[h.typeChangement] || { label: h.typeChangement, variant: 'info' as const };
                      return (
                        <motion.tr
                          key={h.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-slate-100 dark:border-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            <span className="block">{formatDate(h.creeLe)}</span>
                            <span className="text-[10px] text-slate-400">{formatPeriode(h.periodeEffet)}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-xs tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatAriary(h.ancienSalaire)}</td>
                          <td className="px-4 py-2.5 text-xs tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatAriary(h.nouveauSalaire)}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{h.ancienPoste || '—'}</td>
                          <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{h.nouveauPoste || '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 max-w-40 truncate">{h.motif || '—'}</td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Historique bulletins */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader title="Historique des bulletins de paie" subtitle={`${bulletins.length} bulletin(s) disponible(s)`} icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          } />

          {chartData.length > 0 && (
            <div className="mb-5">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => [formatAriary(v), '']} />
                  <Bar dataKey="brut" name="Brut" fill="#e0e7ff" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="net" name="Net" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-indigo-200 dark:bg-indigo-800 inline-block" /> Brut</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-indigo-500 inline-block" /> Net</span>
              </div>
            </div>
          )}

          {bulletins.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Aucun bulletin de paie généré pour cet employé.</p>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60">
                    {['Période', 'Brut', 'Cotisations', 'IRSA', 'Net', 'Statut'].map(h => (
                      <th key={h} className="px-5 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bulletins.slice().reverse().map(b => (
                    <tr key={b.id} className="border-b border-slate-100 dark:border-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatPeriode(b.periode)}</td>
                      <td className="px-5 py-2.5 text-xs tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatAriary(b.totalBrut)}</td>
                      <td className="px-5 py-2.5 text-xs tabular-nums text-red-600 dark:text-red-400 whitespace-nowrap">-{formatAriary(b.totalCotisationsSalariales)}</td>
                      <td className="px-5 py-2.5 text-xs tabular-nums text-amber-600 dark:text-amber-400 whitespace-nowrap">-{formatAriary(b.irsa)}</td>
                      <td className="px-5 py-2.5 text-xs tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatAriary(b.salaireNet)}</td>
                      <td className="px-5 py-2.5">
                        <Badge variant={b.statut === 'paye' ? 'success' : b.statut === 'valide' ? 'info' : 'neutral'}>
                          {b.statut === 'paye' ? 'Payé' : b.statut === 'valide' ? 'Validé' : 'Brouillon'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Modal : Changement de salaire */}
      <Modal
        open={modalChangementOpen}
        onClose={() => setModalChangementOpen(false)}
        title={
          changementForm.typeChangement === 'augmentation' ? 'Augmentation de salaire' :
          changementForm.typeChangement === 'promotion' ? 'Promotion' : 'Rétrogradation'
        }
        subtitle={employe ? `${employe.nom} ${employe.prenom} — ${employe.matricule}` : ''}
        size="md"
        icon={
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalChangementOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitChangement} loading={submitting}>
              {changementForm.typeChangement === 'augmentation' ? "Enregistrer l'augmentation" :
               changementForm.typeChangement === 'promotion' ? 'Enregistrer la promotion' : 'Enregistrer la rétrogradation'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg border" style={{
            borderColor: changementForm.typeChangement === 'augmentation' ? '#10b981' :
                         changementForm.typeChangement === 'promotion' ? '#6366f1' : '#ef4444'
          }}>
            <Badge variant={
              changementForm.typeChangement === 'augmentation' ? 'success' :
              changementForm.typeChangement === 'promotion' ? 'info' : 'danger'
            }>
              {changementForm.typeChangement === 'augmentation' ? 'Augmentation' :
               changementForm.typeChangement === 'promotion' ? 'Promotion' : 'Rétrogradation'}
            </Badge>
            {employe && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Salaire actuel : <strong>{formatAriary(employe.salaireBrut)}</strong>
                {changementForm.typeChangement !== 'promotion' && (
                  <> → {formatAriary(changementForm.nouveauSalaire)}</>
                )}
              </p>
            )}
          </div>

          {changementForm.typeChangement !== 'promotion' && (
            <Input
              label="Nouveau salaire brut"
              type="number"
              step={100}
              value={changementForm.nouveauSalaire}
              onChange={e => setChangementForm(prev => ({ ...prev, nouveauSalaire: parseFloat(e.target.value) || 0 }))}
              suffix="Ar"
              required
            />
          )}

          <Input
            label="Nouveau poste / fonction"
            value={changementForm.nouveauPoste}
            onChange={e => setChangementForm(prev => ({ ...prev, nouveauPoste: e.target.value }))}
            placeholder={employe?.poste}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Période d'effet <span className="text-red-500">*</span>
            </label>
            <select
              value={changementForm.periodeEffet}
              onChange={e => setChangementForm(prev => ({ ...prev, periodeEffet: e.target.value }))}
              className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="">Sélectionner une période...</option>
              {periodesList.map(p => (
                <option key={p} value={p}>{formatPeriode(p)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Motif (optionnel)</label>
            <textarea
              value={changementForm.motif}
              onChange={e => setChangementForm(prev => ({ ...prev, motif: e.target.value }))}
              placeholder="Raison du changement..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Modal : Mouvement */}
      <Modal
        open={modalMouvementOpen}
        onClose={() => setModalMouvementOpen(false)}
        title={mouvementForm.type ? configMouvement[mouvementForm.type]?.label || 'Mouvement' : 'Mouvement'}
        subtitle={employe ? `${employe.nom} ${employe.prenom} — ${employe.matricule}` : ''}
        size="md"
        icon={
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalMouvementOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitMouvement} loading={submittingMouvement} variant={
              mouvementForm.type === 'licenciement' ? 'danger' :
              mouvementForm.type === 'suspension' ? 'warning' : 'secondary'
            }>
              {mouvementForm.type === 'suspension' ? 'Suspendre' :
               mouvementForm.type === 'licenciement' ? 'Licencier' :
               mouvementForm.type === 'depart_retraite' ? 'Départ retraite' : 'Démission'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Badge type */}
          <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <Badge variant={mouvementBadgeVariant[mouvementForm.type] || 'neutral'}>
              {configMouvement[mouvementForm.type]?.label || mouvementForm.type}
            </Badge>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {configMouvement[mouvementForm.type]?.description || ''}
            </p>
          </div>

          {/* Motif */}
          <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Motif{mouvementForm.type !== 'depart_retraite' && <span className="text-red-500">*</span>}
          </label>
            <textarea
              value={mouvementForm.motif}
              onChange={e => setMouvementForm(prev => ({ ...prev, motif: e.target.value }))}
              placeholder="Raison du mouvement..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />
          </div>

          {/* Date début */}
          <Input
            label="Date de début"
            type="date"
            value={mouvementForm.dateDebut}
            onChange={e => setMouvementForm(prev => ({ ...prev, dateDebut: e.target.value }))}
            required
          />

          {/* Date fin (pour suspension) */}
          {mouvementForm.type === 'suspension' && (
            <Input
              label="Date de fin (optionnelle)"
              type="date"
              value={mouvementForm.dateFin}
              onChange={e => setMouvementForm(prev => ({ ...prev, dateFin: e.target.value }))}
              hint="Laissez vide si durée indéterminée"
            />
          )}

          {/* Indemnité (licenciement et retraite) */}
          {showIndemnite && (
            <Input
              label="Indemnité"
              type="number"
              step={1000}
              value={mouvementForm.indemnite}
              onChange={e => setMouvementForm(prev => ({ ...prev, indemnite: parseFloat(e.target.value) || 0 }))}
              suffix="Ar"
            />
          )}

          {/* Pourcentage de rémunération (suspension) */}
          {showPctRemun && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Pourcentage de rémunération pendant suspension
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={mouvementForm.pourcentageRemuneration}
                  onChange={e => setMouvementForm(prev => ({ ...prev, pourcentageRemuneration: parseInt(e.target.value) }))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-12 text-right">
                  {mouvementForm.pourcentageRemuneration}%
                </span>
              </div>
              {employe && (
                <p className="text-xs text-slate-400 mt-1">
                  Estimation : {formatAriary(employe.salaireBrut * mouvementForm.pourcentageRemuneration / 100)}/mois
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal : Congé */}
      <Modal
        open={modalCongeOpen}
        onClose={() => setModalCongeOpen(false)}
        title="Ajouter un congé"
        subtitle={employe ? `${employe.nom} ${employe.prenom} — ${employe.matricule}` : ''}
        size="md"
        icon={
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalCongeOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitConge} loading={submittingConge}>Ajouter le congé</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Libellé du congé"
            value={congeForm.libelle}
            onChange={e => setCongeForm(prev => ({ ...prev, libelle: e.target.value }))}
            placeholder="Ex: Congé annuel, Congé maladie..."
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Motif (optionnel)</label>
            <textarea
              value={congeForm.motif}
              onChange={e => setCongeForm(prev => ({ ...prev, motif: e.target.value }))}
              placeholder="Motif du congé..."
              rows={2}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date de début"
              type="date"
              value={congeForm.dateDebut}
              onChange={e => setCongeForm(prev => ({ ...prev, dateDebut: e.target.value }))}
              required
            />
            <Input
              label="Date de fin"
              type="date"
              value={congeForm.dateFin}
              onChange={e => setCongeForm(prev => ({ ...prev, dateFin: e.target.value }))}
              required
            />
          </div>

          {/* Pourcentage de rémunération pendant congé */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Pourcentage de rémunération pendant le congé
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={congeForm.pourcentageRemuneration}
                onChange={e => setCongeForm(prev => ({ ...prev, pourcentageRemuneration: parseInt(e.target.value) }))}
                className="flex-1 accent-indigo-600"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-12 text-right">
                {congeForm.pourcentageRemuneration}%
              </span>
            </div>
            {employe && (
              <p className="text-xs text-slate-400 mt-1">
                Estimation : {formatAriary(employe.salaireBrut * congeForm.pourcentageRemuneration / 100)}/mois
              </p>
            )}
          </div>

          {congeForm.dateDebut && congeForm.dateFin && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Durée : <strong className="text-slate-700 dark:text-slate-300">
                  {Math.max(1, Math.ceil((new Date(congeForm.dateFin).getTime() - new Date(congeForm.dateDebut).getTime()) / 86400000) + 1)} jour(s)
                </strong>
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
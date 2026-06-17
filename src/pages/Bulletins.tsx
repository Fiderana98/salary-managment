import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { BulletinPaie } from '../types';
import { formatAriary, formatPeriode } from '../utils/format';
import { cn } from '../utils/cn';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { imprimerBulletin, imprimerTousBulletins } from '../utils/print';

const getPeriodesDisponibles = (): string[] => {
  const periodes: string[] = [];
  const aujourdHui = new Date();
  const anneeActuelle = aujourdHui.getFullYear();
  const moisActuel = aujourdHui.getMonth() + 1;

  for (let i = 0; i < 12; i++) {
    let annee = anneeActuelle;
    let mois = moisActuel - i;
    if (mois < 1) {
      mois += 12;
      annee -= 1;
    }
    periodes.push(`${annee}-${mois.toString().padStart(2, '0')}`);
  }
  return periodes;
};

function totalPrimes(bulletin: BulletinPaie): number {
  const autres = bulletin.autresPrimes?.reduce((s, p) => s + p.montant, 0) || 0;
  return bulletin.montantHeuresSup + autres;
}

function BulletinDetail({ bulletin }: { bulletin: BulletinPaie }) {
  const { employes } = useApp();
  const emp = employes.find(e => e.id === bulletin.employeId);
  const primesTotal = totalPrimes(bulletin);

  // Séparer les primes (uniquement depuis autresPrimes + heures sup)
  const primesList = [
    { label: `Heures supplémentaires (${bulletin.heuresSupplementaires}h)`, montant: bulletin.montantHeuresSup, highlight: false, icon: "⏰", imposable: true },
    ...(bulletin.autresPrimes?.map(p => ({
      label: p.libelle,
      montant: p.montant,
      highlight: false,
      icon: "",
      imposable: p.imposable !== undefined ? p.imposable : true
    })) || []),
  ].filter(p => p.montant > 0);

  // Lignes de gains (pour le tableau des éléments de rémunération)
  const lignesGains = [
    { label: 'Salaire de base', montant: bulletin.salaireBrut, highlight: false },
    { label: 'Primes et bonus', montant: primesTotal, highlight: false },
  ];

  return (
    <div className="space-y-5">
      {/* En-tête avec infos employé */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-950/40 dark:to-slate-800/50 border border-indigo-100 dark:border-indigo-900/40">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg">
            {emp?.prenom?.[0]}{emp?.nom?.[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{emp?.nom} {emp?.prenom}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{emp?.poste} — {emp?.matricule}</p>
            <p className="text-xs text-slate-400 mt-0.5">{formatPeriode(bulletin.periode)}</p>
          </div>
        </div>
        <Badge variant={bulletin.statut === 'paye' ? 'success' : bulletin.statut === 'valide' ? 'info' : 'neutral'}>
          {bulletin.statut === 'paye' ? 'Payé' : bulletin.statut === 'valide' ? 'Validé' : 'Brouillon'}
        </Badge>
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total brut', value: bulletin.totalBrut, color: 'text-slate-900 dark:text-white' },
          { label: 'Total primes', value: primesTotal, color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Salaire net', value: bulletin.salaireNet, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(item => (
          <div key={item.label} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className={cn('text-lg font-bold mt-1 tabular-nums', item.color)}>{formatAriary(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Section primes dédiée */}
      {primesList.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Primes et indemnités</p>
          <div className="rounded-lg border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-indigo-100 dark:bg-indigo-900/30">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-indigo-600 dark:text-indigo-400">Libellé</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-indigo-600 dark:text-indigo-400">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100 dark:divide-indigo-900/20">
                {primesList.map((prime, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                      <span className="mr-2">{prime.icon}</span>
                      {prime.label}
                      {prime.imposable === false && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          Non imposable
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {formatAriary(prime.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-indigo-100 dark:bg-indigo-900/30">
                <tr>
                  <td className="px-4 py-2 font-semibold text-slate-900 dark:text-white">Total des primes</td>
                  <td className="px-4 py-2 text-right font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">
                    {formatAriary(primesTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Éléments de rémunération */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Éléments de rémunération</p>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Libellé</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {lignesGains.map(ligne => (
                <tr key={ligne.label} className={ligne.montant === 0 ? 'opacity-50' : ''}>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{ligne.label}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900 dark:text-white tabular-nums">
                    {formatAriary(ligne.montant)}
                  </td>
                </tr>
              ))}
              <tr className="bg-indigo-50 dark:bg-indigo-900/20">
                <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">Total brut</td>
                <td className="px-4 py-2.5 text-right font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">
                  {formatAriary(bulletin.totalBrut)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Retenues salariales */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Retenues salariales</p>
        <div className="rounded-lg border border-red-100 dark:border-red-900/30 overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-red-50 dark:divide-red-900/20">
              <tr>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">CNaPS</td>
                <td className="px-4 py-2.5 text-right font-medium text-red-600 dark:text-red-400 tabular-nums">
                  -{formatAriary(bulletin.cnaps_salarial)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">OSTIE</td>
                <td className="px-4 py-2.5 text-right font-medium text-red-600 dark:text-red-400 tabular-nums">
                  -{formatAriary(bulletin.ostie_salariale)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">IRSA</td>
                <td className="px-4 py-2.5 text-right font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                  -{formatAriary(bulletin.irsa)}
                </td>
              </tr>
              <tr className="bg-red-50 dark:bg-red-900/10">
                <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">Total retenues</td>
                <td className="px-4 py-2.5 text-right font-bold text-red-600 dark:text-red-400 tabular-nums">
                  -{formatAriary(bulletin.totalCotisationsSalariales + bulletin.irsa)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Salaire net à payer */}
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">SALAIRE NET À PAYER</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
            Virement — {emp?.rib || 'RIB non renseigné'}
          </p>
        </div>
        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
          {formatAriary(bulletin.salaireNet)}
        </p>
      </div>
    </div>
  );
}

export default function Bulletins() {
  const { employes, bulletins, genererBulletinsMensuel, validerBulletin, payerBulletin, addNotification } = useApp();
  const [periodesDisponibles] = useState<string[]>(getPeriodesDisponibles());
  const [periode, setPeriode] = useState<string>(() => {
    const aujourdHui = new Date();
    return `${aujourdHui.getFullYear()}-${(aujourdHui.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentPage, setPage] = useState(1);
  const PER_PAGE = 10;
  const [selectedBulletin, setSelectedBulletin] = useState<BulletinPaie | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const bulletinsPeriode = useMemo(() => {
    return bulletins.filter(b => {
      if (b.periode !== periode) return false;
      const emp = employes.find(e => e.id === b.employeId);
      const q = search.toLowerCase();
      const matchSearch = !q || `${emp?.nom} ${emp?.prenom} ${emp?.matricule} ${emp?.poste}`.toLowerCase().includes(q);
      const matchStatut = !filterStatut || b.statut === filterStatut;
      return matchSearch && matchStatut;
    });
  }, [bulletins, periode, search, filterStatut, employes]);

  const paginated = bulletinsPeriode.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const totalPages = Math.ceil(bulletinsPeriode.length / PER_PAGE);

  const stats = useMemo(() => {
    const all = bulletins.filter(b => b.periode === periode);
    return {
      total: all.length,
      brouillons: all.filter(b => b.statut === 'brouillon').length,
      valides: all.filter(b => b.statut === 'valide').length,
      payes: all.filter(b => b.statut === 'paye').length,
      masseSalariale: all.reduce((s, b) => s + b.salaireNet, 0),
      totalPrimes: all.reduce((s, b) => s + totalPrimes(b), 0),
    };
  }, [bulletins, periode]);

  const handleGenerer = async () => {
    const bulletinsExistants = bulletins.some(b => b.periode === periode);
    if (bulletinsExistants) {
      setConfirmModalOpen(true);
      return;
    }
    setGenerating(true);
    try {
      await genererBulletinsMensuel(periode, false);
      toast.success(`Bulletins de ${formatPeriode(periode)} générés avec succès`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la génération des bulletins');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmRegenerate = async () => {
    setConfirmModalOpen(false);
    setGenerating(true);
    try {
      await genererBulletinsMensuel(periode, true);
      toast.success(`Bulletins de ${formatPeriode(periode)} régénérés avec succès`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la régénération');
    } finally {
      setGenerating(false);
    }
  };

  const handleValiderTous = async () => {
    const brouillons = bulletins.filter(b => b.periode === periode && b.statut === 'brouillon');
    try {
      await Promise.all(brouillons.map(b => validerBulletin(b.id)));
      toast.success(`${brouillons.length} bulletin(s) validé(s)`);
      addNotification({ type: 'success', titre: 'Bulletins validés', message: `${brouillons.length} bulletins de ${formatPeriode(periode)} ont été validés.` });
    } catch {
      toast.error('Erreur lors de la validation');
    }
  };

  const handlePayerTous = async () => {
    const valides = bulletins.filter(b => b.periode === periode && b.statut === 'valide');
    try {
      await Promise.all(valides.map(b => payerBulletin(b.id)));
      toast.success(`${valides.length} virement(s) effectué(s)`);
      addNotification({ type: 'success', titre: 'Virements effectués', message: `${valides.length} virements de ${formatPeriode(periode)} ont été traités.` });
    } catch {
      toast.error('Erreur lors du paiement');
    }
  };

  const openDetail = async (b: BulletinPaie) => {
    setDetailOpen(true);
    setLoadingDetail(true);
    setSelectedBulletin(b);
    try {
      const full = await api.getBulletin(b.id);
      setSelectedBulletin(full);
    } catch {
      toast.error('Impossible de charger le détail du bulletin');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            value={periode}
            onChange={e => setPeriode(e.target.value)}
            options={periodesDisponibles.map(p => ({ value: p, label: formatPeriode(p) }))}
            className="w-44"
          />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 w-52"
          />
          <Select
            value={filterStatut}
            onChange={e => { setFilterStatut(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'brouillon', label: 'Brouillon' },
              { value: 'valide', label: 'Validé' },
              { value: 'paye', label: 'Payé' },
            ]}
            className="w-36"
          />
        </div>
        <div className="flex items-center gap-2">
          {stats.total > 0 && (
            <Button variant="secondary" size="sm" onClick={() => {
              const bulletinsPeriodeComplete = bulletins.filter(b => b.periode === periode);
              imprimerTousBulletins(bulletinsPeriodeComplete, (id) => employes.find(e => e.id === id), periode);
            }} icon={
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            }>
              Tout imprimer
            </Button>
          )}
          {stats.brouillons > 0 && (
            <Button variant="secondary" size="sm" onClick={handleValiderTous}>
              Valider tous ({stats.brouillons})
            </Button>
          )}
          {stats.valides > 0 && (
            <Button variant="success" size="sm" onClick={handlePayerTous} icon={
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            }>
              Virer ({stats.valides})
            </Button>
          )}
          <Button onClick={handleGenerer} loading={generating} icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }>
            Générer bulletins
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total bulletins', value: stats.total, color: 'text-slate-700 dark:text-slate-300' },
          { label: 'Brouillons', value: stats.brouillons, color: 'text-slate-500 dark:text-slate-400' },
          { label: 'Validés', value: stats.valides, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Payés', value: stats.payes, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Total primes', value: formatAriary(stats.totalPrimes), color: 'text-indigo-600 dark:text-indigo-400', isText: true },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 p-4"
          >
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1', s.color, s.isText && 'text-base')}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {stats.total > 0 && (
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Masse salariale nette — {formatPeriode(periode)}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{formatAriary(stats.masseSalariale)}</p>
            </div>
            <div className="h-8 w-0.5 bg-slate-200 dark:bg-slate-700" />
            <div className="text-right">
              <p className="text-xs text-slate-400">Avancement paiement</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-32 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${stats.total > 0 ? (stats.payes / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {stats.total > 0 ? Math.round((stats.payes / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Liste des bulletins de paie">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/60">
                {['Employé', 'Poste', 'Base', 'Primes', 'Total brut', 'Retenues', 'Net', 'Statut', 'Actions'].map(h => (
                  <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {bulletinsPeriode.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="h-10 w-10 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Aucun bulletin pour {formatPeriode(periode)}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Cliquez sur « Générer bulletins » pour créer les fiches de paie</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((b, i) => {
                    const emp = employes.find(e => e.id === b.employeId);
                    const primes = totalPrimes(b);
                    return (
                      <motion.tr
                        key={b.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-slate-100 dark:border-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 text-[10px] font-bold shrink-0">
                              {emp?.prenom[0]}{emp?.nom[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white text-xs">{emp?.nom} {emp?.prenom}</p>
                              <p className="text-[11px] text-slate-400">{emp?.matricule}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{emp?.poste}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-slate-700 dark:text-slate-300">{formatAriary(b.salaireBrut)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums font-medium text-indigo-600 dark:text-indigo-400">{formatAriary(primes)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-slate-700 dark:text-slate-300">{formatAriary(b.totalBrut)}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-red-600 dark:text-red-400">
                          -{formatAriary(b.totalCotisationsSalariales + b.irsa)}
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{formatAriary(b.salaireNet)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={b.statut === 'paye' ? 'success' : b.statut === 'valide' ? 'info' : 'neutral'}>
                            {b.statut === 'paye' ? 'Payé' : b.statut === 'valide' ? 'Validé' : 'Brouillon'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => {
                              const emp = employes.find(e => e.id === b.employeId);
                              imprimerBulletin(b, emp);
                            }} className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors" title="Imprimer le bulletin">
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            </button>
                            <button onClick={() => openDetail(b)} className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors" title="Voir le détail">
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            {b.statut === 'brouillon' && (
                              <button onClick={async () => { await validerBulletin(b.id); toast.success('Bulletin validé'); }} className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors" title="Valider">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </button>
                            )}
                            {b.statut === 'valide' && (
                              <button onClick={async () => { await payerBulletin(b.id); toast.success('Virement effectué'); }} className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-colors" title="Marquer payé">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, bulletinsPeriode.length)} sur {bulletinsPeriode.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800 transition-colors"
                aria-label="Page précédente"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn('flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-colors', p === currentPage ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800')}
                  aria-current={p === currentPage ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800 transition-colors"
                aria-label="Page suivante"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Bulletins existants"
        subtitle={`Période : ${formatPeriode(periode)}`}
        size="sm"
        icon={
          <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleConfirmRegenerate}>Oui, régénérer</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Des bulletins existent déjà pour la période <strong>{formatPeriode(periode)}</strong>.
          <br /><br />
          Si vous régénérez, les anciens bulletins seront supprimés et remplacés par de nouveaux.
          <br /><br />
          Cette action est <strong className="text-red-600">irréversible</strong>.
        </p>
      </Modal>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Bulletin de paie"
        subtitle={selectedBulletin ? `Période : ${formatPeriode(selectedBulletin.periode)}` : ''}
        size="lg"
        icon={
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        footer={
          <>
            {selectedBulletin && (
              <Button variant="primary" size="sm" onClick={() => {
                const emp = employes.find(e => e.id === selectedBulletin.employeId);
                imprimerBulletin(selectedBulletin, emp);
              }} icon={
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              }>
                Imprimer
              </Button>
            )}
            <Button variant="secondary" onClick={() => setDetailOpen(false)}>Fermer</Button>
          </>
        }
      >
        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : selectedBulletin ? (
          <BulletinDetail bulletin={selectedBulletin} />
        ) : null}
      </Modal>
    </div>
  );
}
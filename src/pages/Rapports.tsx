import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatAriary, formatPeriode } from '../utils/format';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { imprimerRapport } from '../utils/print';
import { cn } from '../utils/cn';

type ViewMode = 'ensemble' | 'personnalisee';

export default function Rapports() {
  const { employes, bulletins, loading } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('ensemble');
  const [periodeDebut, setPeriodeDebut] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [periodeFin, setPeriodeFin] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // Mois courant
  const currentMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  // Périodes disponibles
  const periodesDisponibles = useMemo(() => {
    const set = new Set<string>();
    bulletins.forEach(b => set.add(b.periode));
    return Array.from(set).sort();
  }, [bulletins]);

  // Bulletins filtrés
  const filteredBulletins = useMemo(() => {
    if (viewMode === 'ensemble') {
      return bulletins.filter(b => b.periode === currentMonth);
    }
    return bulletins.filter(b => b.periode >= periodeDebut && b.periode <= periodeFin);
  }, [viewMode, bulletins, currentMonth, periodeDebut, periodeFin]);

  // Stats de la période
  const periodeStats = useMemo(() => {
    const effectif = filteredBulletins.length;
    const totalBrut = filteredBulletins.reduce((s, b) => s + b.totalBrut, 0);
    const totalNet = filteredBulletins.reduce((s, b) => s + b.salaireNet, 0);
    const totalIrsa = filteredBulletins.reduce((s, b) => s + b.irsa, 0);
    const totalCotisations = filteredBulletins.reduce((s, b) => s + b.totalCotisationsSalariales, 0);
    const bulletinsPayes = filteredBulletins.filter(b => b.statut === 'paye').length;
    return { effectif, totalBrut, totalNet, totalIrsa, totalCotisations, bulletinsPayes };
  }, [filteredBulletins]);

  // Données mensuelles pour les graphiques
  const monthlyData = useMemo(() => {
    const statsParPeriode: Record<string, any> = {};
    bulletins.forEach(b => {
      if (!statsParPeriode[b.periode]) {
        statsParPeriode[b.periode] = {
          periode: b.periode,
          brut: 0,
          net: 0,
          irsa: 0,
          cotisations: 0,
          count: 0,
        };
      }
      statsParPeriode[b.periode].brut += b.totalBrut;
      statsParPeriode[b.periode].net += b.salaireNet;
      statsParPeriode[b.periode].irsa += b.irsa;
      statsParPeriode[b.periode].cotisations += b.totalCotisationsSalariales;
      statsParPeriode[b.periode].count++;
    });

    return Object.values(statsParPeriode)
      .sort((a: any, b: any) => a.periode.localeCompare(b.periode))
      .map((s: any) => ({
        periode: s.periode,
        mois: formatPeriode(s.periode).split(' ')[0].slice(0, 3),
        brut: s.brut,
        net: s.net,
        irsa: s.irsa,
        cotisations: s.cotisations,
        count: s.count,
      }));
  }, [bulletins]);

  // Données par département
  const deptData = useMemo(() => {
    const deptMap: Record<string, { brut: number; count: number }> = {};
    const actifs = employes.filter(e => e.statut === 'actif');
    actifs.forEach(e => {
      const dept = e.departement || 'Non défini';
      if (!deptMap[dept]) deptMap[dept] = { brut: 0, count: 0 };
      deptMap[dept].brut += Number(e.salaireBrut) || 0;
      deptMap[dept].count += 1;
    });
    return Object.entries(deptMap)
      .map(([name, v]) => ({
        name: name.length > 15 ? name.slice(0, 14) + '…' : name,
        brut: v.brut,
        moy: Math.round(v.brut / v.count),
        count: v.count,
      }))
      .sort((a, b) => b.brut - a.brut)
      .slice(0, 8);
  }, [employes]);

  // Stats globales
  const statsGlobales = useMemo(() => {
    const totalBulletins = bulletins.length;
    const bulletinsPayes = bulletins.filter(b => b.statut === 'paye').length;
    const totalNetPaye = bulletins.filter(b => b.statut === 'paye').reduce((s, b) => s + b.salaireNet, 0);
    const salaireMoyen = employes.length > 0
      ? employes.reduce((s, e) => s + (Number(e.salaireBrut) || 0), 0) / employes.length
      : 0;
    return { totalBulletins, bulletinsPayes, totalNetPaye, salaireMoyen };
  }, [bulletins, employes]);

  // Gestion impression
  const handlePrint = () => {
    const periodeLabel = viewMode === 'ensemble' 
      ? formatPeriode(currentMonth)
      : `${formatPeriode(periodeDebut)} → ${formatPeriode(periodeFin)}`;
    
    imprimerRapport({
      titre: `Rapport de paie - ${periodeLabel}`,
      periode: periodeLabel,
      stats: periodeStats,
      totalBulletins: statsGlobales.totalBulletins,
      bulletinsPaies: statsGlobales.bulletinsPayes,
      totalNetPaye: statsGlobales.totalNetPaye,
      monthlyData: monthlyData,
      deptData: deptData,
      employes: employes,
      bulletins: filteredBulletins,
    });
  };

  // Personnalisation du tooltip
  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.value > 10000 ? formatAriary(p.value, true) : p.value}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const hasData = filteredBulletins.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Rapports de paie</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {viewMode === 'ensemble' 
              ? `Analyse du mois de ${formatPeriode(currentMonth)}` 
              : `Analyse personnalisée`
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sélecteur de vue */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setViewMode('ensemble')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === 'ensemble'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              )}
            >
              Mois en cours
            </button>
            <button
              onClick={() => setViewMode('personnalisee')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === 'personnalisee'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              )}
            >
              Période
            </button>
          </div>
          <Button
            size="sm"
            onClick={handlePrint}
            disabled={!hasData}
            icon={
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            }
          >
            Imprimer
          </Button>
        </div>
      </div>

      {/* ==================== FILTRES ==================== */}
      {viewMode === 'personnalisee' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-800/60 p-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Début</label>
              <select
                value={periodeDebut}
                onChange={e => setPeriodeDebut(e.target.value)}
                className="w-full sm:w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {periodesDisponibles.map(p => (
                  <option key={p} value={p}>{formatPeriode(p)}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fin</label>
              <select
                value={periodeFin}
                onChange={e => setPeriodeFin(e.target.value)}
                className="w-full sm:w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {periodesDisponibles.map(p => (
                  <option key={p} value={p}>{formatPeriode(p)}</option>
                ))}
              </select>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const last = periodesDisponibles[periodesDisponibles.length - 1];
                if (last) { setPeriodeDebut(last); setPeriodeFin(last); }
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </motion.div>
      )}

      {/* ==================== STATS ==================== */}
      {hasData ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5"
        >
          <Card className="p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Effectif</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{periodeStats.effectif}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Masse brute</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{formatAriary(periodeStats.totalBrut, true)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Masse nette</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatAriary(periodeStats.totalNet, true)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Cotisations</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatAriary(periodeStats.totalCotisations, true)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide">IRSA</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatAriary(periodeStats.totalIrsa, true)}</p>
          </Card>
        </motion.div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-400">
            {viewMode === 'ensemble' 
              ? 'Aucun bulletin pour le mois en cours.' 
              : 'Aucune donnée pour la période sélectionnée.'
            }
          </p>
        </Card>
      )}

      {/* ==================== GRAPHIQUES ==================== */}
      {hasData && monthlyData.length > 0 && (
        <>
          {/* Graphique 1 : Évolution */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader
                title="Évolution mensuelle"
                subtitle="Masse brute vs nette"
                icon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
              />
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gBrut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
                  <Tooltip content={customTooltip} />
                  <Area type="monotone" dataKey="brut" name="Masse brute" stroke="#6366f1" strokeWidth={2} fill="url(#gBrut)" dot={false} />
                  <Area type="monotone" dataKey="net" name="Masse nette" stroke="#10b981" strokeWidth={2} fill="url(#gNet)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Graphique 2 : Départements */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader
                  title="Masse par département"
                  subtitle="Répartition des salaires bruts"
                  icon={
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
                {deptData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={deptData} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={customTooltip} />
                      <Bar dataKey="brut" name="Masse salariale" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-slate-400">Aucune donnée</div>
                )}
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card>
                <CardHeader
                  title="Cotisations vs IRSA"
                  subtitle="Prélèvements mensuels"
                  icon={
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                      <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1e6).toFixed(1)}M`} />
                      <Tooltip content={customTooltip} />
                      <Bar dataKey="cotisations" name="Cotisations" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
                      <Bar dataKey="irsa" name="IRSA" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-slate-400">Aucune donnée</div>
                )}
              </Card>
            </motion.div>
          </div>
        </>
      )}

      {/* ==================== TABLEAU RÉCAPITULATIF ==================== */}
      {hasData && monthlyData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card padding="none">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Récapitulatif mensuel</h3>
              <span className="text-xs text-slate-400">{monthlyData.length} mois</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Période</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Employés</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Masse brute</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Masse nette</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">IRSA</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.slice().reverse().map((s: any, i: number) => (
                    <tr key={s.periode} className={cn(
                      "border-b border-slate-100 dark:border-slate-700/40",
                      i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                    )}>
                      <td className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300">{formatPeriode(s.periode)}</td>
                      <td className="px-4 py-2 text-right text-xs text-slate-500 dark:text-slate-400">{s.count}</td>
                      <td className="px-4 py-2 text-right text-xs tabular-nums text-slate-700 dark:text-slate-300">{formatAriary(s.brut)}</td>
                      <td className="px-4 py-2 text-right text-xs tabular-nums text-emerald-600 dark:text-emerald-400">{formatAriary(s.net)}</td>
                      <td className="px-4 py-2 text-right text-xs tabular-nums text-amber-600 dark:text-amber-400">{formatAriary(s.irsa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatAriary, formatPeriode } from '../utils/format';
import StatCard from '../components/ui/StatCard';
import Card, { CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4898'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs font-semibold" style={{ color: p.color }}>
            {p.name}: {formatAriary(p.value, true)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { employes, bulletins, loading } = useApp();
  const [statsMensuelles, setStatsMensuelles] = useState<any[]>([]);

  // Calculer les stats mensuelles à partir des bulletins
  useEffect(() => {
    if (bulletins.length > 0) {
      const statsParPeriode = bulletins.reduce((acc: any, b) => {
        if (!acc[b.periode]) {
          acc[b.periode] = {
            periode: b.periode,
            masseSalariale: 0,
            totalBrut: 0,
            nombreEmployes: 0,
          };
        }
        acc[b.periode].masseSalariale += b.salaireNet;
        acc[b.periode].totalBrut += b.totalBrut;
        acc[b.periode].nombreEmployes++;
        return acc;
      }, {});
      setStatsMensuelles(Object.values(statsParPeriode).sort((a: any, b: any) => a.periode.localeCompare(b.periode)));
    }
  }, [bulletins]);

  const stats = useMemo(() => {
    if (!employes || employes.length === 0) {
      return {
        actifs: 0,
        total: 0,
        masseSalariale: 0,
        bulletinsMoisCourant: [],
        bulletinsValides: 0,
      };
    }
    
    const actifs = employes.filter(e => e.statut === 'actif').length;
    const total = employes.length;
    const masseSalariale = employes.filter(e => e.statut === 'actif').reduce((s, e) => s + (Number(e.salaireBrut) || 0), 0);
    const bulletinsMoisCourant = bulletins.filter(b => b.periode === '2024-12');
    const bulletinsValides = bulletins.filter(b => b.statut === 'valide' || b.statut === 'paye').length;
    return { actifs, total, masseSalariale, bulletinsMoisCourant, bulletinsValides };
  }, [employes, bulletins]);

  // Données graphique évolution - utiliser les données réelles
  const chartData = statsMensuelles.map(s => ({
    mois: formatPeriode(s.periode).split(' ')[0].slice(0, 3),
    masse: s.masseSalariale,
    brut: s.totalBrut,
  }));

  // Répartition par département
  const deptData = useMemo(() => {
    if (!employes.length) return [];
    const map: Record<string, number> = {};
    employes.filter(e => e.statut === 'actif').forEach(e => {
      map[e.departement] = (map[e.departement] || 0) + (Number(e.salaireBrut) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace('Comptabilité & Finance', 'Comptabilité'), value }));
  }, [employes]);

  // Répartition par statut
  const statusData = useMemo(() => {
    if (!employes.length) return [];
    const map: Record<string, number> = {};
    employes.forEach(e => { map[e.statut] = (map[e.statut] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [employes]);

  // Derniers mouvements
  const recentBulletins = [...bulletins]
    .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          index={0}
          title="Employés actifs"
          value={`${stats.actifs}`}
          sub={`${stats.total} au total`}
          color="indigo"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5" />
              <circle cx="12" cy="8" r="4" />
            </svg>
          }
        />
        <StatCard
          index={1}
          title="Masse salariale"
          value={stats.masseSalariale ? formatAriary(stats.masseSalariale, true) : '0 Ar'}
          sub="Brut mensuel"
          color="emerald"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          index={2}
          title="Bulletins générés"
          value={`${bulletins.length}`}
          sub={`${stats.bulletinsValides} validés`}
          color="violet"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          index={3}
          title="Masse brute"
          value={statsMensuelles.length > 0 ? formatAriary(statsMensuelles[statsMensuelles.length - 1]?.totalBrut || 0, true) : '0 Ar'}
          sub="Dernier mois"
          color="amber"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader
              title="Évolution de la masse salariale"
              subtitle="12 derniers mois — Ar"
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              }
            />
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gMasse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gBrut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="masse" name="Masse salariale" stroke="#6366f1" strokeWidth={2} fill="url(#gMasse)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                  <Area type="monotone" dataKey="brut" name="Masse brute" stroke="#10b981" strokeWidth={2} fill="url(#gBrut)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-400">Aucune donnée disponible</div>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-indigo-500 inline-block" /> Masse salariale</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-emerald-500 inline-block" /> Masse brute</span>
            </div>
          </Card>
        </motion.div>

        {/* Pie chart répartition dept */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader
              title="Répartition par département"
              subtitle="En masse salariale"
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              }
            />
            {deptData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={deptData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {deptData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatAriary(Number(v), true)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {deptData.slice(0, 4).map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <span className="h-2 w-2 rounded-full inline-block shrink-0" style={{ background: COLORS[i] }} />
                        <span className="truncate max-w-28">{d.name || 'Non défini'}</span>
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{formatAriary(d.value, true)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400">Aucune donnée</div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Charts row 2 - garder la même structure avec catData */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Bar chart statuts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card>
            <CardHeader
              title="Répartition par statut"
              subtitle="Nombre d'employés"
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip formatter={(v: any) => [`${v} employés`, 'Effectif']} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400">Aucune donnée</div>
            )}
          </Card>
        </motion.div>

        {/* Derniers bulletins */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Card>
            <CardHeader
              title="Activité récente"
              subtitle="Bulletins de paie"
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            {recentBulletins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <svg className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-slate-400">Aucun bulletin généré</p>
                <p className="text-xs text-slate-400 mt-1">Rendez-vous dans la section Bulletins</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700/60 -mx-5">
                {recentBulletins.map(b => {
                  const emp = employes.find(e => e.id === b.employeId);
                  return (
                    <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-bold">
                          {emp?.prenom?.[0] || '?'}{emp?.nom?.[0] || ''}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{emp?.nom} {emp?.prenom}</p>
                          <p className="text-[11px] text-slate-400">{formatPeriode(b.periode)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatAriary(b.salaireNet, true)}</p>
                        <Badge variant={b.statut === 'paye' ? 'success' : b.statut === 'valide' ? 'info' : 'neutral'}>
                          {b.statut === 'paye' ? 'Payé' : b.statut === 'valide' ? 'Validé' : 'Brouillon'}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
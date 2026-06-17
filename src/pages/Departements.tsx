// pages/Departements.tsx
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useApp } from '../context/AppContext';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/Modal';
import { formatAriary } from '../utils/format';
import toast from 'react-hot-toast';

// Couleurs pour les graphiques
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Composant Tooltip personnalisé
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name}: {p.name === 'Employés' || p.name === 'count' 
            ? p.value 
            : formatAriary(p.value, true)}
        </p>
      ))}
    </div>
  );
};

// // Formateur pour l'axe Y
// const formatYAxis = (value: number) => {
//   if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
//   if (value >= 1e3) return `${(value / 1e3).toFixed(0)}k`;
//   return value.toString();
// };

// Label pour le PieChart
const renderPieLabel = ({ percent }: { percent?: number }) => {
  if (percent && percent > 0.05) {
    return `${(percent * 100).toFixed(0)}%`;
  }
  return '';
};

export default function Departements() {
  const { 
    departements, 
    employes,
    loadDepartements, 
    addDepartement, 
    updateDepartement, 
    deleteDepartement 
  } = useApp();
  
  const [nom, setNom] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNom, setEditingNom] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    loadDepartements();
  }, [loadDepartements]);

  // Calcul des statistiques par département
  const statsParDept = useMemo(() => {
    const stats: Record<string, { count: number; masseSalariale: number; employes: any[] }> = {};
    
    departements.forEach(dept => {
      stats[dept.id] = {
        count: 0,
        masseSalariale: 0,
        employes: []
      };
    });
    
    stats['sans'] = {
      count: 0,
      masseSalariale: 0,
      employes: []
    };
    
    employes.forEach(emp => {
      const deptId = emp.departementId || 'sans';
      if (!stats[deptId]) {
        stats[deptId] = { count: 0, masseSalariale: 0, employes: [] };
      }
      stats[deptId].count++;
      stats[deptId].masseSalariale += Number(emp.salaireBrut) || 0;
      stats[deptId].employes.push(emp);
    });
    
    return stats;
  }, [departements, employes]);

  // Données pour le graphique en barres (nombre d'employés)
  const barChartData = useMemo(() => {
    return departements
      .map(dept => ({
        id: dept.id,
        nom: dept.nom.length > 15 ? dept.nom.slice(0, 12) + '…' : dept.nom,
        nomComplet: dept.nom,
        count: statsParDept[dept.id]?.count || 0,
        masse: statsParDept[dept.id]?.masseSalariale || 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [departements, statsParDept]);

  // Données pour le camembert (masse salariale)
  const pieData = useMemo(() => {
    return departements
      .map(dept => ({
        id: dept.id,
        name: dept.nom.length > 20 ? dept.nom.slice(0, 18) + '…' : dept.nom,
        nameComplet: dept.nom,
        value: statsParDept[dept.id]?.masseSalariale || 0,
        count: statsParDept[dept.id]?.count || 0,
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [departements, statsParDept]);

  // Données pour le graphique en barres horizontales (masse salariale)
  const masseBarData = useMemo(() => {
    return departements
      .map(dept => ({
        id: dept.id,
        name: dept.nom.length > 12 ? dept.nom.slice(0, 10) + '…' : dept.nom,
        nameComplet: dept.nom,
        masse: statsParDept[dept.id]?.masseSalariale || 0,
        count: statsParDept[dept.id]?.count || 0,
      }))
      .filter(d => d.masse > 0)
      .sort((a, b) => b.masse - a.masse);
  }, [departements, statsParDept]);

  const totalEmployes = employes.filter(e => e.statut === 'actif').length;
  const totalMasseSalariale = employes.reduce((sum, e) => sum + (Number(e.salaireBrut) || 0), 0);

  const handleAdd = async () => {
    if (!nom.trim()) {
      toast.error('Veuillez saisir un nom');
      return;
    }
    try {
      await addDepartement(nom.trim());
      setNom('');
      toast.success('Département ajouté');
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
  };

  const handleEdit = (id: string, currentNom: string) => {
    setEditingId(id);
    setEditingNom(currentNom);
  };

  const handleUpdate = async () => {
    if (!editingId || !editingNom.trim()) return;
    try {
      await updateDepartement(editingId, editingNom.trim());
      setEditingId(null);
      setEditingNom('');
      toast.success('Département modifié');
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteDepartement(deleteId);
      toast.success('Département supprimé');
    } catch (err: any) {
      toast.error(err.message || 'Impossible de supprimer (département utilisé par des employés)');
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-5">

      {/* Liste des départements */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card>
          <CardHeader 
            title="Liste des départements" 
            subtitle="Ajouter, modifier ou supprimer un département"
          />
          <div className="flex gap-3 mb-6">
            <Input
              placeholder="Nom du département"
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAdd}>Ajouter</Button>
          </div>

          <div className="space-y-2">
            {departements.map(dept => {
              const stats = statsParDept[dept.id];
              return (
                <div key={dept.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 py-2">
                  {editingId === dept.id ? (
                    <div className="flex gap-2 flex-1">
                      <Input
                        value={editingNom}
                        onChange={e => setEditingNom(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleUpdate}>Enregistrer</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Annuler</Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{dept.nom}</span>
                        {stats && stats.count > 0 && (
                          <div className="flex gap-3 mt-0.5 text-xs">
                            <span className="text-indigo-600 dark:text-indigo-400">
                              {stats.count} employé{stats.count > 1 ? 's' : ''}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {formatAriary(stats.masseSalariale)}
                            </span>
                          </div>
                        )}
                        {(!stats || stats.count === 0) && (
                          <p className="text-xs text-slate-400 mt-0.5">Aucun employé</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(dept.id, dept.nom)} 
                          className="text-amber-600 hover:text-amber-800 text-sm"
                        >
                          Modifier
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(dept.id)} 
                          className={`text-sm ${stats && stats.count > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'}`}
                          disabled={stats && stats.count > 0}
                          title={stats && stats.count > 0 ? "Impossible de supprimer un département avec des employés" : ""}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {departements.length === 0 && (
              <p className="text-slate-400 text-center py-4">Aucun département. Créez-en un.</p>
            )}
          </div>
        </Card>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Départements', value: departements.length.toString(), sub: 'au total', color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Employés', value: totalEmployes.toString(), sub: 'actifs', color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Masse salariale', value: formatAriary(totalMasseSalariale, true), sub: 'mensuelle brute', color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Moyenne / dép.', value: formatAriary(departements.length > 0 ? totalMasseSalariale / departements.length : 0, true), sub: 'par département', color: 'text-violet-600 dark:text-violet-400' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-800/60 p-4"
          >
            <p className="text-xs text-slate-400 uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Graphiques côte à côte */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Camembert : Masse salariale par département */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader
              title="Masse salariale par département"
              subtitle="Répartition en pourcentage"
              icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            {pieData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      label={renderPieLabel}
                      labelLine={false}
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
                  {pieData.slice(0, 5).map((item, i) => (
                    <div key={item.id} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 dark:text-slate-400 truncate max-w-24">{item.name}</span>
                    </div>
                  ))}
                  {pieData.length > 5 && (
                    <span className="text-slate-400 text-xs">+{pieData.length - 5} autres</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-400">
                Aucune donnée - Ajoutez des employés
              </div>
            )}
          </Card>
        </motion.div>

        {/* Barres : Nombre d'employés par département */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader
              title="Employés par département"
              subtitle="Effectif actif"
              icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5m5-12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            />
            {barChartData.length > 0 && barChartData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barChartData} margin={{ top: 4, right: 4, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                  <XAxis 
                    dataKey="nom" 
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                    axisLine={false} 
                    tickLine={false}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Employés" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-400">
                Aucun employé - Ajoutez des employés
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Graphique masse salariale (barres horizontales) */}
      {/* <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader
            title="Masse salariale par département (détail)"
            subtitle="Comparaison visuelle"
            icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          />
          {masseBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(250, masseBarData.length * 35)}>
              <BarChart data={masseBarData} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="masse" name="Masse salariale" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400">Aucune donnée</div>
          )}
        </Card>
      </motion.div> */}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer un département"
        message="Attention : cette action est irréversible. Les employés qui utilisaient ce département ne seront pas supprimés, mais leur département deviendra inconnu. Il est recommandé de reassigner les employés avant la suppression."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
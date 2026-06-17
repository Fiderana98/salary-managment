import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Prime, Employe } from '../types';
import { formatAriary } from '../utils/format';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import { cn } from '../utils/cn';

const typeOptions = [
  { value: 'ciblee', label: 'Prime ciblée (personne/département/tous)' },
  { value: 'automatique', label: 'Prime automatique (ex: ancienneté)' },
];

const cibleOptions = [
  { value: 'personne', label: 'Une personne' },
  { value: 'departement', label: 'Un département' },
  { value: 'tous', label: 'Tous les employés' },
];

const modeOptions = [
  { value: 'fixe', label: 'Valeur fixe (Ar)' },
  { value: 'taux', label: 'Pourcentage (%)' },
];

// ─── PrimeForm (Modal d'ajout / modification) ─────────────────────────────────
interface PrimeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editPrime?: Prime | null;
  employes: Employe[];
  departements: { id: string; nom: string }[];
}


function Switch({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        checked ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

function PrimeForm({ open, onClose, onSave, editPrime, employes, departements }: PrimeFormProps) {
  const [libelle, setLibelle] = useState('');
  const [type, setType] = useState<'ciblee' | 'automatique'>('ciblee');
  const [cible, setCible] = useState<'personne' | 'departement' | 'tous'>('personne');
  const [employeId, setEmployeId] = useState('');
  const [departementId, setDepartementId] = useState('');
  const [mode, setMode] = useState<'fixe' | 'taux'>('fixe');
  const [valeur, setValeur] = useState(0);
  const [imposable, setImposable] = useState(true);
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setLibelle('');
    setType('ciblee');
    setCible('personne');
    setEmployeId('');
    setDepartementId('');
    setMode('fixe');
    setValeur(0);
    setImposable(true);
    setDateDebut(new Date().toISOString().split('T')[0]);
    setDateFin('');
    setDescription('');
  }, []);

  useEffect(() => {
    if (editPrime) {
      setLibelle(editPrime.libelle);
      setType(editPrime.type);
      if (editPrime.type === 'ciblee') {
        setCible(editPrime.cible || 'personne');
        setEmployeId(editPrime.employeId || '');
        setDepartementId(editPrime.departementId || '');
      }
      setMode(editPrime.mode);
      setValeur(editPrime.valeur);
      setImposable(editPrime.imposable !== undefined ? editPrime.imposable : true);
      setDateDebut(editPrime.dateDebut);
      setDateFin(editPrime.dateFin || '');
      setDescription(editPrime.description || '');
    } else {
      resetForm();
    }
  }, [editPrime, open, resetForm]);

  const handleSubmit = async () => {
    if (!libelle.trim()) { toast.error('Le libellé est requis'); return; }
    if (valeur <= 0) { toast.error('La valeur doit être positive'); return; }
    if (type === 'ciblee' && cible === 'personne' && !employeId) { toast.error('Veuillez sélectionner un employé'); return; }
    if (type === 'ciblee' && cible === 'departement' && !departementId) { toast.error('Veuillez sélectionner un département'); return; }
    if (!dateDebut) { toast.error('La date de début est requise'); return; }

    setSaving(true);
    try {
      const payload: any = {
        libelle: libelle.trim(),
        type,
        mode,
        valeur,
        imposable,
        dateDebut,
        dateFin: dateFin || null,
        description: description.trim(),
      };
      if (type === 'ciblee') {
        payload.cible = cible;
        if (cible === 'personne') payload.employeId = employeId;
        if (cible === 'departement') payload.departementId = departementId;
      }
      await onSave(payload);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!editPrime;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier la prime' : 'Nouvelle prime'}
      subtitle={isEdit ? `Modification de « ${editPrime?.libelle} »` : 'Ajouter une prime ou un bonus'}
      size="lg"
      icon={
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} loading={saving} icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          }>
            {isEdit ? 'Enregistrer les modifications' : 'Créer la prime'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Libellé */}
        <Input
          label="Libellé de la prime"
          placeholder="Ex: Prime du meilleur employé"
          value={libelle}
          onChange={e => setLibelle(e.target.value)}
          required
        />

        {/* Type */}
        <Select
          label="Type de prime"
          options={typeOptions}
          value={type}
          onChange={e => setType(e.target.value as 'ciblee' | 'automatique')}
        />

        {type === 'ciblee' && (
          <>
            {/* Cible */}
            <Select
              label="Attribuée à"
              options={cibleOptions}
              value={cible}
              onChange={e => setCible(e.target.value as 'personne' | 'departement' | 'tous')}
            />

            {cible === 'personne' && (
              <Select
                label="Employé"
                options={[
                  { value: '', label: 'Sélectionner un employé' },
                  ...employes.filter(e => e.statut === 'actif').map(e => ({
                    value: e.id,
                    label: `${e.nom} ${e.prenom} — ${e.poste}`,
                  })),
                ]}
                value={employeId}
                onChange={e => setEmployeId(e.target.value)}
                required
              />
            )}

            {cible === 'departement' && (
              <Select
                label="Département"
                options={[
                  { value: '', label: 'Sélectionner un département' },
                  ...departements.map(d => ({
                    value: d.id,
                    label: d.nom,
                  })),
                ]}
                value={departementId}
                onChange={e => setDepartementId(e.target.value)}
                required
              />
            )}
          </>
        )}

        {type === 'automatique' && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-300">
            <strong>Prime automatique :</strong> Cette prime s'appliquera automatiquement à tous les employés actifs éligibles.
          </div>
        )}

        {/* Mode */}
        <Select
          label="Mode de calcul"
          options={modeOptions}
          value={mode}
          onChange={e => setMode(e.target.value as 'fixe' | 'taux')}
        />

        {/* Valeur */}
        <Input
          label={mode === 'fixe' ? 'Montant fixe' : 'Taux'}
          type="number"
          min={0}
          step={mode === 'fixe' ? 1000 : 0.1}
          value={valeur}
          onChange={e => setValeur(parseFloat(e.target.value) || 0)}
          suffix={mode === 'fixe' ? 'Ar' : '%'}
          hint={mode === 'taux' ? 'Pourcentage du salaire brut mensuel' : 'Montant en Ariary'}
          required
        />

        {/* Imposable */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Prime imposable</label>
            <p className="text-xs text-slate-400 mt-0.5">
              {imposable 
                ? 'Sera soumise aux cotisations (CNaPS, OSTIE) et à l\'IRSA' 
                : 'Sera ajoutée exonérée, sans cotisations ni IRSA'}
            </p>
          </div>
          <Switch checked={imposable} onChange={() => setImposable(!imposable)} />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date de début"
            type="date"
            value={dateDebut}
            onChange={e => setDateDebut(e.target.value)}
            required
          />
          <Input
            label="Date de fin (optionnelle)"
            type="date"
            value={dateFin}
            onChange={e => setDateFin(e.target.value)}
            min={dateDebut}
            hint="Laissez vide si permanente"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Description (optionnelle)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description ou motif de la prime..."
            rows={3}
            className="h-20 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 placeholder:text-slate-400 resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── Page Primes ─────────────────────────────────────────────────────────────
export default function Primes() {
  const { employes, departements, addNotification } = useApp();
  const [primes, setPrimes] = useState<Prime[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editPrime, setEditPrime] = useState<Prime | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Prime | null>(null);
  const [filter, setFilter] = useState<string>('tous');

  const loadPrimes = useCallback(async () => {
    try {
      const data = await api.getPrimes();
      setPrimes(data);
    } catch (err) {
      console.error('Erreur chargement primes:', err);
      toast.error('Impossible de charger les primes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrimes();
  }, [loadPrimes]);

  const handleSave = async (data: any) => {
    if (editPrime) {
      const updated = await api.updatePrime(editPrime.id, data);
      setPrimes(prev => prev.map(p => p.id === updated.id ? updated : p));
      addNotification({ type: 'success', titre: 'Prime modifiée', message: `« ${updated.libelle} » a été modifiée.` });
      toast.success('Prime modifiée avec succès');
    } else {
      const created = await api.createPrime(data);
      setPrimes(prev => [created, ...prev]);
      addNotification({ type: 'success', titre: 'Prime créée', message: `« ${created.libelle} » a été créée.` });
      toast.success('Prime créée avec succès');
    }
  };

  const handleToggle = async (prime: Prime) => {
    try {
      const updated = await api.togglePrime(prime.id);
      setPrimes(prev => prev.map(p => p.id === updated.id ? updated : p));
      toast.success(updated.actif ? 'Prime activée' : 'Prime désactivée');
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.deletePrime(deleteConfirm.id);
      setPrimes(prev => prev.filter(p => p.id !== deleteConfirm.id));
      addNotification({ type: 'info', titre: 'Prime supprimée', message: `« ${deleteConfirm.libelle} » a été supprimée.` });
      toast.success('Prime supprimée');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const openEdit = (prime: Prime) => {
    setEditPrime(prime);
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditPrime(null);
    setFormOpen(true);
  };

  const getTargetLabel = (prime: Prime): string => {
    if (prime.type === 'automatique') return 'Tous les employés (auto)';
    if (prime.cible === 'tous') return 'Tous les employés';
    if (prime.cible === 'personne') {
      const emp = employes.find(e => e.id === prime.employeId);
      return emp ? `${emp.nom} ${emp.prenom}` : 'Employé inconnu';
    }
    if (prime.cible === 'departement') {
      const dept = departements.find(d => d.id === prime.departementId);
      return dept ? dept.nom : 'Département inconnu';
    }
    return '—';
  };

  const getModeLabel = (prime: Prime): string => {
    return prime.mode === 'fixe' ? formatAriary(prime.valeur) : `${prime.valeur} %`;
  };

  const filteredPrimes = filter === 'tous' ? primes : primes.filter(p => p.type === filter);

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Gestion des primes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Créez et gérez les primes et bonus (ciblés ou automatiques)</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: 'tous', label: 'Toutes les primes' },
              { value: 'ciblee', label: 'Primes ciblées' },
              { value: 'automatique', label: 'Primes automatiques' },
            ]}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <Button onClick={openCreate} icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }>
            Nouvelle prime
          </Button>
        </div>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total primes</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{primes.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Actives</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{primes.filter(p => p.actif).length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Inactives</p>
            <p className="text-2xl font-bold text-slate-500 mt-1">{primes.filter(p => !p.actif).length}</p>
          </div>
        </Card>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Empty state */}
      {!loading && primes.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <svg className="h-6 w-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Aucune prime définie</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-xs">
              Créez votre première prime, qu'elle soit ciblée (personne, département, tous) ou automatique.
            </p>
            <Button onClick={openCreate} icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }>
              Créer une prime
            </Button>
          </div>
        </Card>
      )}

      {/* List of primes */}
      {!loading && filteredPrimes.length > 0 && (
        <div className="space-y-3">
          {filteredPrimes.map((prime, index) => (
            <motion.div
              key={prime.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{prime.libelle}</h3>
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
                          prime.type === 'automatique'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        )}>
                          {prime.type === 'automatique' ? 'Auto' : 'Ciblée'}
                        </span>
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
                          prime.actif
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                        )}>
                          {prime.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-slate-600 dark:text-slate-300">Cible :</span> {getTargetLabel(prime)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-slate-600 dark:text-slate-300">Valeur :</span> {getModeLabel(prime)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-slate-600 dark:text-slate-300">Début :</span> {prime.dateDebut}
                        </span>
                        {prime.dateFin && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Fin :</span> {prime.dateFin}
                          </span>
                        )}
                      </div>
                      {prime.description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 italic">{prime.description}</p>
                      )}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={prime.actif}
                          onChange={() => handleToggle(prime)}
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {prime.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <button
                        onClick={() => openEdit(prime)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        title="Modifier"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(prime)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form modal */}
      <PrimeForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditPrime(null); }}
        onSave={handleSave}
        editPrime={editPrime}
        employes={employes}
        departements={departements}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Supprimer la prime"
        message={`Êtes-vous sûr de vouloir supprimer la prime « ${deleteConfirm?.libelle} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
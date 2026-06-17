import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Employe, Sexe, Statut } from '../types';
import { formatAriary, calculerAnciennete, normalizeDateForInput} from '../utils/format';
import { cn } from '../utils/cn';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Input, { Select } from '../components/ui/Input';

// PhoneInput component that handles +261XXXXXXXXX format
function PhoneInput({
  value = '',
  onChange,
  error
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  // Store digits in state to make them reactive
  const [digits, setDigits] = useState<string[]>(() => {
    const match = value.match(/^\+261(\d{9})$/);
    if (match) return match[1].split('');
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 9) return cleaned.split('');
    return Array(9).fill('');
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isInternalUpdate = useRef(false);
  
  if (inputRefs.current.length !== 9) {
    inputRefs.current = Array(9).fill(null);
  }

  // Sync external value changes with internal state (only when not internal)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    
    const match = value.match(/^\+261(\d{9})$/);
    if (match) {
      const newDigits = match[1].split('');
      setDigits(newDigits);
    } else {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length === 9) {
        setDigits(cleaned.split(''));
      } else if (cleaned.length === 0) {
        setDigits(Array(9).fill(''));
      }
    }
  }, [value]);

  const updateDigits = (idx: number, digit: string) => {
    const newDigits = [...digits];
    newDigits[idx] = digit;
    setDigits(newDigits);
    // Store as +261XXXXXXXXX format
    const fullNumber = `+261${newDigits.join('')}`;
    isInternalUpdate.current = true;
    onChange(fullNumber);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (e.currentTarget.value === '' && idx > 0) {
        // Move to previous input and clear it
        inputRefs.current[idx - 1]?.focus();
        updateDigits(idx - 1, '');
      } else if (e.currentTarget.value !== '') {
        // Clear current digit
        updateDigits(idx, '');
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    // Take last 9 digits if more are pasted
    const chars = pasted.slice(-9).split('');
    const newDigits = [...digits];
    for (let i = 0; i < 9 && i < chars.length; i++) {
      newDigits[i] = chars[i];
    }
    setDigits(newDigits);
    isInternalUpdate.current = true;
    onChange(`+261${newDigits.join('')}`);
    
    // Focus the next empty field or last field
    const nextEmptyIdx = newDigits.findIndex(d => !d);
    if (nextEmptyIdx !== -1) {
      inputRefs.current[nextEmptyIdx]?.focus();
    } else {
      inputRefs.current[8]?.focus();
    }
  };

  // Get group class based on position for visual spacing
  const getGroupClass = (i: number) => {
    if (i === 1) return "mr-2"; // After first group (2 digits)
    if (i === 3) return "mr-2"; // After second group (2 digits)
    if (i === 6) return "mr-2"; // After third group (3 digits)
    return "";
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
        Téléphone
      </label>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center px-2 h-7 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          +261
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <input
              key={i}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              className={cn(
                "w-6 h-7 text-center text-sm rounded border border-slate-200 dark:border-slate-700",
                "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                "transition-all duration-200",
                error && "border-red-500 focus:ring-red-500",
                getGroupClass(i)
              )}
              maxLength={1}
              value={digits[i] || ''}
              onChange={e => {
                const digit = e.target.value.replace(/\D/g, '').slice(0, 1);
                if (digit) {
                  updateDigits(i, digit);
                  if (i < 8) {
                    inputRefs.current[i + 1]?.focus();
                  }
                } else {
                  updateDigits(i, '');
                }
              }}
              onKeyDown={e => handleKeyDown(e, i)}
              onPaste={handlePaste}
              ref={el => {
                inputRefs.current[i] = el;
              }}
            />
          ))}
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

// Rest of the imports remain the same...
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import toast from 'react-hot-toast';

const statutBadge = (s: Statut) => {
  switch (s) {
    case 'actif': return <Badge variant="success" dot>Actif</Badge>;
    case 'conge': return <Badge variant="warning" dot>Congé</Badge>;
    case 'suspendu': return <Badge variant="danger" dot>Suspendu</Badge>;
    case 'depart': return <Badge variant="neutral" dot>Retraité</Badge>;
  }
};

const emptyForm: Omit<Employe, 'id' | 'matricule'> = {
  nom: '', prenom: '', sexe: 'M', dateNaissance: '', dateEmbauche: '',
  poste: '', departement: '', departementId: undefined,
  statut: 'actif', salaireBrut: 0, email: '', telephone: '',
  adresse: '', nombreEnfants: 0, rib: '',
};

export default function Employes() {
  const {
    employes,
    departements,
    addEmploye,
    updateEmploye,
    deleteEmploye,
    setCurrentPage,
    setCurrentEmployeId,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employe | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [currentPage, setPage] = useState(1);
  const PER_PAGE = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employes.filter(e => {
      const matchSearch = !q || `${e.nom} ${e.prenom} ${e.matricule} ${e.poste} ${e.departement}`.toLowerCase().includes(q);
      const matchStatut = !filterStatut || e.statut === filterStatut;
      const matchDept = !filterDept || e.departementId === filterDept;
      return matchSearch && matchStatut && matchDept;
    });
  }, [employes, search, filterStatut, filterDept]);

  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...emptyForm });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (e: Employe) => {
    setEditTarget(e);
    const { id: _id, matricule: _m, ...rest } = e;
    setForm({
      ...rest,
      dateNaissance: normalizeDateForInput(rest.dateNaissance),
      dateEmbauche: normalizeDateForInput(rest.dateEmbauche),
    });
    setErrors({});
    setModalOpen(true);
  };

  const openDelete = (id: string) => {
    setDeleteTarget(id);
    setConfirmOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nom.trim()) e.nom = 'Le nom est requis';
    if (!form.prenom.trim()) e.prenom = 'Le prénom est requis';
    if (!form.dateEmbauche) {
      e.dateEmbauche = "La date d'embauche est requise";
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (form.dateEmbauche > today) {
        e.dateEmbauche = "La date d'embauche ne peut pas être dans le futur";
      }
    }
    if (!form.poste.trim()) e.poste = 'Le poste est requis';
    if (!form.departementId) e.departementId = 'Le département est requis';
    if (form.salaireBrut < 262680) e.salaireBrut = 'Le salaire doit être ≥ 262 680 Ar (SME)';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (form.telephone) {
      // Check if it matches +261 followed by exactly 9 digits
      const phoneRegex = /^\+261\d{9}$/;
      if (!phoneRegex.test(form.telephone)) {
        e.telephone = 'Téléphone invalide, format attendu: +261 suivi de 9 chiffres';
      }
    }
    if (form.dateNaissance) {
      const today = new Date().toISOString().split('T')[0];
      if (form.dateNaissance > today) {
        e.dateNaissance = "La date de naissance ne peut pas être dans le futur";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      if (editTarget) {
        await updateEmploye({ ...editTarget, ...form });
        toast.success('Employé mis à jour avec succès');
      } else {
        await addEmploye(form as Omit<Employe, 'id' | 'matricule'>);
        toast.success('Employé ajouté avec succès');
      }
      setModalOpen(false);
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      toast.error(error?.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmploye(deleteTarget);
      toast.success('Employé supprimé');
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteTarget(null);
      setConfirmOpen(false);
    }
  };

  const viewFiche = (e: Employe) => {
    setCurrentEmployeId(e.id);
    setCurrentPage('fiche_employe');
  };

  const handleDeptChange = (deptId: string) => {
    const dept = departements.find(d => d.id === deptId);
    setForm(prev => ({
      ...prev,
      departementId: deptId || undefined,
      departement: dept?.nom ?? '',
    }));
  };

  const upd = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} employé{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openAdd} icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        }>
          Ajouter un employé
        </Button>
      </div>

      {/* Filters (unchanged) */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Rechercher par nom, matricule, poste..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              icon={<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></svg>}
            />
          </div>
          <Select
            value={filterStatut}
            onChange={e => { setFilterStatut(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'actif', label: 'Actif' },
              { value: 'conge', label: 'En congé' },
              { value: 'suspendu', label: 'Suspendu' },
              { value: 'depart', label: 'Retraité' },
            ]}
            className="w-40"
          />
          <Select
            value={filterDept}
            onChange={e => { setFilterDept(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Tous les dép.' },
              ...departements.map(d => ({ value: d.id, label: d.nom })),
            ]}
            className="w-52"
          />
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden ml-auto">
            <button
              onClick={() => setView('table')}
              className={cn('px-3 py-1.5 text-xs font-medium transition-colors', view === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800')}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 4v16M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
            </button>
            <button
              onClick={() => setView('cards')}
              className={cn('px-3 py-1.5 text-xs font-medium transition-colors', view === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800')}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            </button>
          </div>
        </div>
      </Card>

      {/* Table view */}
      {view === 'table' && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label="Liste des employés">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60">
                  {['Matricule', 'Employé', 'Département', 'Poste', 'Salaire brut', 'Ancienneté', 'Statut', 'Actions'].map(h => (
                    <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                        Aucun employé ne correspond à vos critères de recherche.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((e, i) => (
                      <motion.tr
                        key={e.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-slate-100 dark:border-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{e.matricule}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 text-[11px] font-bold">
                              {e.prenom[0]}{e.nom[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{e.nom} {e.prenom}</p>
                              <p className="text-xs text-slate-400">{e.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{e.departement}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{e.poste}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-xs tabular-nums">{formatAriary(e.salaireBrut)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{calculerAnciennete(e.dateEmbauche)}</td>
                        <td className="px-4 py-3">{statutBadge(e.statut)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => viewFiche(e)} className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors" title="Voir la fiche">
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button onClick={() => openEdit(e)} className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-400 transition-colors" title="Modifier">
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => openDelete(e.id)} className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors" title="Supprimer">
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} sur {filtered.length}
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
      )}

      {/* Cards view */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {paginated.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 text-sm font-bold">
                        {e.prenom[0]}{e.nom[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{e.nom} {e.prenom}</p>
                        <p className="text-xs text-slate-400">{e.matricule}</p>
                      </div>
                    </div>
                    {statutBadge(e.statut)}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between"><span className="text-slate-400">Poste</span><span className="font-medium text-slate-700 dark:text-slate-300 text-right max-w-36 truncate">{e.poste}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Département</span><span className="font-medium text-slate-700 dark:text-slate-300 text-right max-w-36 truncate">{e.departement}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Salaire brut</span><span className="font-semibold text-slate-900 dark:text-white">{formatAriary(e.salaireBrut)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Ancienneté</span><span className="font-medium">{calculerAnciennete(e.dateEmbauche)}</span></div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <Button size="sm" variant="ghost" onClick={() => viewFiche(e)} icon={<svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}>
                      Fiche
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(e)} icon={<svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}>
                      Modifier
                    </Button>
                    <button onClick={() => openDelete(e.id)} className="ml-auto flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Ajout/Modification - UPDATED Phone section */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Modifier un employé' : 'Ajouter un employé'}
        subtitle={editTarget ? `${editTarget.matricule} — ${editTarget.nom} ${editTarget.prenom}` : 'Remplissez les informations du nouvel employé'}
        size="lg"
        icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>{editTarget ? 'Enregistrer' : 'Ajouter'}</Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Identité */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Identité</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nom" value={form.nom} onChange={e => upd('nom', e.target.value)} error={errors.nom} required />
              <Input label="Prénom" value={form.prenom} onChange={e => upd('prenom', e.target.value)} error={errors.prenom} required />
              <Select label="Sexe" value={form.sexe} onChange={e => upd('sexe', e.target.value as Sexe)}
                options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]} />
              <Input label="Date de naissance" type="date" value={form.dateNaissance} onChange={e => upd('dateNaissance', e.target.value)} error={errors.dateNaissance} />
              <Input label="Date d'embauche" type="date" value={form.dateEmbauche} onChange={e => upd('dateEmbauche', e.target.value)} error={errors.dateEmbauche} required />
              <Input label="Nombre d'enfants" type="number" min={0} value={form.nombreEnfants} onChange={e => upd('nombreEnfants', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {/* Poste */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Poste & Classification</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Poste / Fonction" value={form.poste} onChange={e => upd('poste', e.target.value)} error={errors.poste} required />
              <Select
                label="Département"
                value={form.departementId ?? ''}
                onChange={e => handleDeptChange(e.target.value)}
                error={errors.departementId}
                options={[
                  { value: '', label: 'Sélectionner...' },
                  ...departements.map(d => ({ value: d.id, label: d.nom })),
                ]}
                required
              />
              <Select label="Statut" value={form.statut} onChange={e => upd('statut', e.target.value as Statut)}
                options={[{ value: 'actif', label: 'Actif' }, { value: 'conge', label: 'En congé' }, { value: 'suspendu', label: 'Suspendu' }, { value: 'depart', label: 'Départ' }]} />
              <Input label="Salaire brut de base" type="number" step={100} value={form.salaireBrut} onChange={e => upd('salaireBrut', parseFloat(e.target.value) || 0)} error={errors.salaireBrut} suffix="Ar" required />
            </div>
          </div>

          {/* Contact & Paiement - UPDATED with improved phone input */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Contact & Paiement</p>
            <div className="grid grid-cols-1 gap-3">
              {/* Email on its own row */}
              <Input 
                label="Email professionnel" 
                type="email" 
                value={form.email} 
                onChange={e => upd('email', e.target.value)} 
                error={errors.email} 
              />
              
              {/* Phone input on its own row with better UX */}
              <PhoneInput
                value={form.telephone}
                onChange={val => upd('telephone', val)}
                error={errors.telephone}
              />
              
              {/* Address and banking info */}
              <Input 
                label="Adresse" 
                value={form.adresse} 
                onChange={e => upd('adresse', e.target.value)} 
              />
              <Input 
                label="RIB / Compte bancaire" 
                value={form.rib} 
                onChange={e => upd('rib', e.target.value)} 
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm delete (unchanged) */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Supprimer l'employé"
        message="Cette action est irréversible. L'employé et tous ses bulletins de paie associés seront définitivement supprimés."
        confirmLabel="Supprimer définitivement"
        variant="danger"
      />
    </div>
  );
}
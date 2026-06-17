import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { ParametresPaie, TrancheIrsa } from '../types';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

// ─── Input pourcentage (version complète avec label) ──────────────────────
function PercentageInput({
  value,
  onChange,
  label,
  step = 0.01,
  disabled = false,
}: {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  step?: number;
  disabled?: boolean;
}) {
  // Afficher en format français avec virgule
  const displayVal = (value * 100).toFixed(2).replace('.', ',');

  return (
    <Input
      label={label}
      type="text"
      inputMode="decimal"
      step={step}
      value={displayVal}
      onChange={e => {
        // Accepter virgule ET point, normaliser vers le point pour parseFloat
        const raw = e.target.value.replace(',', '.');
        const v = parseFloat(raw);
        if (!isNaN(v)) onChange(v / 100);
      }}
      suffix="%"
      disabled={disabled}
    />
  );
}

// ─── Input pourcentage compact pour cellules de tableau (validation au blur) ─
function TauxCellInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const fmt = (v: number) => (v * 100).toFixed(2).replace('.', ',');
  const [displayValue, setDisplayValue] = useState<string>(fmt(value));
  const [isFocused, setIsFocused] = useState(false);
  const [lastValid, setLastValid] = useState<number>(value);

  useEffect(() => {
    if (!isFocused) setDisplayValue(fmt(value));
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // En focus, afficher avec point pour faciliter l'édition
    setDisplayValue(String(value * 100));
  };

  const handleBlur = () => {
    setIsFocused(false);
    const normalizedValue = displayValue.replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    if (!isNaN(numValue) && normalizedValue.trim() !== '') {
      setDisplayValue(fmt(numValue / 100));
      onChange(numValue / 100);
      setLastValid(numValue / 100);
    } else {
      setDisplayValue(fmt(lastValid));
      onChange(lastValid);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full h-8 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-2 pr-6 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
    </div>
  );
}

export default function Parametres() {
  const { parametres, updateParametres } = useApp();
  const [form, setForm] = useState<ParametresPaie>(parametres);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(parametres);
  }, [parametres]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateParametres(form);
      toast.success('Paramètres enregistrés avec succès');
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const upd = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const addTranche = () => {
    const lastTranche = form.tranches_irsa[form.tranches_irsa.length - 1];
    const newMin = lastTranche?.max !== null ? (lastTranche?.max || 0) + 1 : (lastTranche?.min || 0) + 100000;
    
    setForm(prev => ({
      ...prev,
      tranches_irsa: [
        ...prev.tranches_irsa,
        { min: newMin, max: null, taux: 0 },
      ],
    }));
  };

  const removeTranche = (idx: number) => {
    if (form.tranches_irsa.length <= 1) {
      toast.error('Il doit y avoir au moins une tranche');
      return;
    }
    setForm(prev => ({
      ...prev,
      tranches_irsa: prev.tranches_irsa.filter((_, i) => i !== idx),
    }));
  };

  // Calculer le min dynamique pour chaque tranche (sauf la première)
  const getDynamicMin = (idx: number, tranches: TrancheIrsa[]): number => {
    if (idx === 0) return tranches[0]?.min ?? 0;
    const prev = tranches[idx - 1];
    // min = max précédent + 1 (si max est null, utiliser min précédent + 1)
    return prev?.max !== null ? (prev?.max ?? 0) + 1 : (prev?.min ?? 0) + 1;
  };

  const updTranche = (idx: number, field: keyof TrancheIrsa, value: any) => {
    setForm(prev => {
      const newTranches = [...prev.tranches_irsa];
      const numValue = field === 'max' && value === '' ? null : Number(value);
      
      if (field === 'max') {
        newTranches[idx] = { ...newTranches[idx], max: numValue };
      } else {
        newTranches[idx] = { ...newTranches[idx], [field]: numValue as number };
      }
      
      // Recalculer les min dynamiques pour toutes les tranches suivantes
      for (let i = idx + 1; i < newTranches.length; i++) {
        const prev = newTranches[i - 1];
        const newMin = prev.max !== null ? prev.max + 1 : (prev.min ?? 0) + 1;
        newTranches[i] = { ...newTranches[i], min: newMin };
      }
      
      // Si la dernière tranche a un max défini, forcer à null (dernière tranche = ∞)
      if (idx === newTranches.length - 1 && newTranches[idx].max !== null) {
        newTranches[idx] = { ...newTranches[idx], max: null };
      }
      
      // Si on modifie le max d'une tranche et que ça dépasse le min de la suivante, ajuster
      if (field === 'max' && idx < newTranches.length - 1 && numValue !== null) {
        const nextMin = getDynamicMin(idx + 1, newTranches);
        if (numValue >= nextMin) {
          newTranches[idx] = { ...newTranches[idx], max: nextMin - 1 };
          // Re-recalculer après ajustement
          for (let i = idx + 1; i < newTranches.length; i++) {
            const p = newTranches[i - 1];
            newTranches[i] = { ...newTranches[i], min: p.max !== null ? p.max + 1 : (p.min ?? 0) + 1 };
          }
        }
      }
      
      return { ...prev, tranches_irsa: newTranches };
    });
  };

  return (
    <div className="space-y-5">
      {/* Cotisations sociales */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader
            title="Cotisations sociales"
            subtitle="Taux salariaux CNaPS et OSTIE"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PercentageInput
              label="CNaPS salariale"
              value={form.cnaps_salarial}
              onChange={val => upd('cnaps_salarial', val)}
            />
            <PercentageInput
              label="OSTIE salariale"
              value={form.ostie_salariale}
              onChange={val => upd('ostie_salariale', val)}
            />
          </div>
        </Card>
      </motion.div>

      {/* Heures supplémentaires */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader
            title="Heures supplémentaires"
            subtitle="Taux et heures de travail mensuelles"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Heures mensuelles"
              type="number"
              step={0.01}
              value={form.heures_travail_mensuel}
              onChange={e => upd('heures_travail_mensuel', parseFloat(e.target.value) || 173.33)}
              suffix="h"
            />
            <PercentageInput
              label="Taux heure supplémentaire"
              value={form.taux_heure_supplementaire}
              onChange={val => upd('taux_heure_supplementaire', val)}
              step={0.01}
            />
          </div>
        </Card>
      </motion.div>

      {/* IRSA - Version corrigée */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader
            title="Tranches IRSA"
            subtitle="Base imposable après déduction des cotisations sociales"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            }
          />
          
          {/* Info forfait */}
          <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Règle de calcul IRSA :</strong> Si base imposable &lt; 350 000 Ar → forfait 3 000 Ar. 
              Sinon : (base imposable - 350 000) × taux + 3 000 Ar
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide w-12">#</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Minimum (Ar)</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Maximum (Ar)</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Taux (%)</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide w-12"></th>
                </tr>
              </thead>
              <tbody>
                {form.tranches_irsa.map((t, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700/40">
                    <td className="px-2 py-2 text-xs text-slate-500 dark:text-slate-400">{i + 1}</td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={t.min}
                        onChange={e => updTranche(i, 'min', parseFloat(e.target.value) || 0)}
                        className="w-full h-8 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        disabled={i > 0}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={i === form.tranches_irsa.length - 1 ? '' : (t.max === null ? '' : t.max)}
                        onChange={e => updTranche(i, 'max', e.target.value)}
                        placeholder={i === form.tranches_irsa.length - 1 ? "∞" : ""}
                        disabled={i === form.tranches_irsa.length - 1}
                        className="w-full h-8 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <TauxCellInput
                        value={t.taux}
                        onChange={val => updTranche(i, 'taux', val)}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => removeTranche(i)}
                        className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Supprimer cette tranche">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <Button variant="secondary" size="sm" onClick={addTranche} icon={
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }>
              Ajouter une tranche
            </Button>
            
            {/* <div className="text-right">
              <p className="text-[10px] text-slate-400">
                Dernière tranche : max = ∞ (illimité)
              </p>
            </div> */}
          </div>
        </Card>
      </motion.div>

      {/* Sauvegarde */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          }>
            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
// ─── Formatage Ariary ─────────────────────────────────────────────────────────
export function formatAriary(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)} M Ar`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `${(amount / 1_000).toFixed(0)} k Ar`;
    }
  }
  return new Intl.NumberFormat('fr-MG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' Ar';
}

// ─── Formatage de date ───────────────────────────────────────────────────────
// Normalise une date pour l'input type="date" (format YYYY-MM-DD)
export function normalizeDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  // Si c'est déjà au format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    let date = dateStr;
    if (dateStr.includes('T') && dateStr.includes('Z')) {
      date = dateStr.split('T')[0];
    }
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(date));
  } catch {
    return dateStr;
  }
}

export function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    let date = dateStr;
    if (dateStr.includes('T') && dateStr.includes('Z')) {
      date = dateStr.split('T')[0];
    }
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    }).format(new Date(date));
  } catch {
    return dateStr;
  }
}

export function formatPeriode(periode: string): string {
  if (!periode) return '—';
  const [year, month] = periode.split('-');
  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];
  return `${mois[parseInt(month) - 1]} ${year}`;
}

// ─── Formatage de pourcentage ────────────────────────────────────────────────
export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)} %`;
}

// ─── Calcul de l'ancienneté ──────────────────────────────────────────────────
export function calculerAnciennete(dateEmbauche: string | null | undefined): string {
  if (!dateEmbauche) return '—';
  try {
    let date = dateEmbauche;
    if (dateEmbauche.includes('T') && dateEmbauche.includes('Z')) {
      date = dateEmbauche.split('T')[0];
    }
    const debut = new Date(date);
    const now = new Date();
    const annees = now.getFullYear() - debut.getFullYear();
    const mois = now.getMonth() - debut.getMonth();
    const totalMois = annees * 12 + mois;
    if (totalMois < 12) return `${totalMois} mois`;
    const ans = Math.floor(totalMois / 12);
    const reste = totalMois % 12;
    if (reste === 0) return `${ans} an${ans > 1 ? 's' : ''}`;
    return `${ans} an${ans > 1 ? 's' : ''} ${reste} mois`;
  } catch {
    return '—';
  }
}

// ─── Génération d'ID ─────────────────────────────────────────────────────────
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateMatricule(index: number): string {
  return `EMP-${String(index).padStart(3, '0')}`;
}
// Configuration de l'API
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api';

// ─── Fonctions utilitaires ──────────────────────────────────────────────────────────
function normalizeDateForAPI(date: string | null | undefined): string | null {
  if (!date) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function normalizeDateForDisplay(date: string | null | undefined): string {
  if (!date) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

// ─── Mappers snake_case → camelCase ──────────────────────────────────────────
function mapEmploye(raw: any) {
  if (!raw) return raw;
  return {
    id: raw.id,
    matricule: raw.matricule,
    nom: raw.nom,
    prenom: raw.prenom,
    sexe: raw.sexe,
    dateNaissance: normalizeDateForDisplay(raw.date_naissance ?? raw.dateNaissance ?? ''),
    dateEmbauche: normalizeDateForDisplay(raw.date_embauche ?? raw.dateEmbauche ?? ''),
    poste: raw.poste,
    departement: raw.departement_nom ?? raw.departement ?? '',
    departementId: raw.departement_id ?? raw.departementId ?? null,
    statut: raw.statut,
    salaireBrut: parseFloat(raw.salaire_brut ?? raw.salaireBrut ?? 0),
    email: raw.email ?? '',
    telephone: raw.telephone ?? '',
    adresse: raw.adresse ?? '',
    nombreEnfants: raw.nombre_enfants ?? raw.nombreEnfants ?? 0,
    rib: raw.rib ?? '',
  };
}

function mapBulletin(raw: any) {
  if (!raw) return raw;
  return {
    id: raw.id,
    employeId: raw.employe_id ?? raw.employeId,
    periode: raw.periode,
    salaireBrut: parseFloat(raw.salaire_brut ?? raw.salaireBrut ?? 0),
    heuresSupplementaires: parseFloat(raw.heures_supplementaires ?? raw.heuresSupplementaires ?? 0),
    montantHeuresSup: parseFloat(raw.montant_heures_sup ?? raw.montantHeuresSup ?? 0),
    primeTransport: parseFloat(raw.prime_transport ?? raw.primeTransport ?? 0),
    primeAnciennete: parseFloat(raw.prime_anciennete ?? raw.primeAnciennete ?? 0),
    autresPrimes: raw.primes ?? raw.autresPrimes ?? [],
    totalBrut: parseFloat(raw.total_brut ?? raw.totalBrut ?? 0),
    cnaps_salarial: parseFloat(raw.cnaps_salarial ?? 0),
    ostie_salariale: parseFloat(raw.ostie_salariale ?? 0),
    totalCotisationsSalariales: parseFloat(raw.total_cotisations_salariales ?? raw.totalCotisationsSalariales ?? 0),
    irsa: parseFloat(raw.irsa ?? 0),
    salaireNet: parseFloat(raw.salaire_net ?? raw.salaireNet ?? 0),
    statut: raw.statut,
    dateCreation: raw.cree_le ?? raw.dateCreation ?? new Date().toISOString(),
    dateValidation: raw.date_validation ?? raw.dateValidation,
    datePaiement: raw.date_paiement ?? raw.datePaiement,
  };
}

function mapParametres(raw: any) {
  if (!raw) return raw;
  return {
    sme_non_agricole: parseFloat(raw.sme_non_agricole ?? 262680),
    sme_agricole: parseFloat(raw.sme_agricole ?? 266500),
    plafond_multiplier: parseFloat(raw.plafond_multiplier ?? 8),
    cnaps_salarial: parseFloat(raw.cnaps_salarial ?? 0.01),
    cnaps_patronal: parseFloat(raw.cnaps_patronal ?? 0.13),
    ostie_salariale: parseFloat(raw.ostie_salariale ?? 0.01),
    ostie_patronale: parseFloat(raw.ostie_patronale ?? 0.05),
    fmfp_patronal: parseFloat(raw.fmfp_patronal ?? 0.01),
    heures_travail_mensuel: parseFloat(raw.heures_travail_mensuel ?? 173.33),
    taux_heure_supplementaire: parseFloat(raw.taux_heure_supplementaire ?? 1.3),
    prime_anciennete_taux: parseFloat(raw.prime_anciennete_taux ?? 0.01),
    prime_transport_defaut: parseFloat(raw.prime_transport_defaut ?? 30000),
    tranches_irsa: Array.isArray(raw.tranches_irsa)
      ? raw.tranches_irsa.map((t: any) => ({
          min: parseFloat(t.min ?? t.montant_min ?? 0),
          max: t.max !== undefined
            ? (t.max === null ? null : parseFloat(t.max))
            : (t.montant_max === null ? null : parseFloat(t.montant_max ?? 0)),
          taux: parseFloat(t.taux ?? 0),
        }))
      : [],
  };
}

function mapNotification(raw: any) {
  if (!raw) return raw;
  return {
    id: raw.id,
    type: raw.type,
    titre: raw.titre,
    message: raw.message,
    date: raw.cree_le ?? raw.date ?? new Date().toISOString(),
    lu: !!(raw.lu),
  };
}

// ─── Service API ──────────────────────────────────────────────────────────────

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      const optHeaders = options.headers as Record<string, string>;
      Object.keys(optHeaders).forEach(key => {
        headers[key] = optHeaders[key];
      });
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
      }
      const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
      throw new Error(error.error || 'Une erreur est survenue');
    }

    if (response.status === 204) return undefined as unknown as T;

    return response.json();
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const response = await this.request<{ token: string; utilisateur: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, motDePasse: password }),
    });
    this.setToken(response.token);
    return response.utilisateur;
  }

  async logout() {
    this.clearToken();
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  // ── Employés ──────────────────────────────────────────────────────────────

  async getEmployes(params?: { statut?: string; departementId?: string; search?: string }) {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString() : '';
    const raw = await this.request<any[]>(`/employes${query ? `?${query}` : ''}`);
    return (raw ?? []).map(mapEmploye);
  }

  async getEmploye(id: string) {
    const raw = await this.request<any>(`/employes/${id}`);
    return mapEmploye(raw);
  }

  async createEmploye(data: any) {
    // Fonction utilitaire pour convertir undefined en null
    const toSqlValue = (value: any) => {
      if (value === undefined) return null;
      return value;
    };
    
    const payload = {
      nom: toSqlValue(data.nom),
      prenom: toSqlValue(data.prenom),
      sexe: toSqlValue(data.sexe) || 'M',
      dateNaissance: normalizeDateForAPI(data.dateNaissance),
      dateEmbauche: normalizeDateForAPI(data.dateEmbauche),
      poste: toSqlValue(data.poste),
      departementId: toSqlValue(data.departementId),
      statut: toSqlValue(data.statut) || 'actif',
      salaireBrut: toSqlValue(data.salaireBrut),
      email: toSqlValue(data.email),
      telephone: toSqlValue(data.telephone),
      adresse: toSqlValue(data.adresse),
      nombreEnfants: toSqlValue(data.nombreEnfants) ?? 0,
      rib: toSqlValue(data.rib),
    };

    console.log('CreateEmploye - Payload envoyé:', payload);

    const raw = await this.request<any>('/employes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapEmploye(raw);
  }

  async updateEmploye(id: string, data: any) {
    const payload = {
      nom: data.nom,
      prenom: data.prenom,
      sexe: data.sexe,
      date_naissance: normalizeDateForAPI(data.dateNaissance),
      date_embauche: normalizeDateForAPI(data.dateEmbauche),
      poste: data.poste,
      // FIX: transmettre departement_id de façon cohérente avec createEmploye
      departement_id: data.departementId ?? null,
      statut: data.statut,
      salaire_brut: data.salaireBrut,
      email: data.email || null,
      telephone: data.telephone || null,
      adresse: data.adresse || null,
      nombre_enfants: data.nombreEnfants ?? 0,
      rib: data.rib || null,
    };

    console.log('UpdateEmploye - Payload envoyé:', payload);

    const raw = await this.request<any>(`/employes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapEmploye(raw);
  }

  async deleteEmploye(id: string) {
    return this.request<void>(`/employes/${id}`, {
      method: 'DELETE',
    });
  }

  // ── Bulletins ─────────────────────────────────────────────────────────────

  async getBulletins(params?: { periode?: string; statut?: string; employeId?: string }) {
    const query = params ? new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString() : '';
    const raw = await this.request<any[]>(`/bulletins${query ? `?${query}` : ''}`);
    return (raw ?? []).map(mapBulletin);
  }

  async getBulletin(id: string) {
    const raw = await this.request<any>(`/bulletins/${id}`);
    return mapBulletin(raw);
  }

  async genererBulletins(periode: string, force: boolean = false) {
    try {
      const response = await this.request<any>('/bulletins/generer', {
        method: 'POST',
        body: JSON.stringify({ periode, force }),
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async validerBulletin(id: string) {
    const raw = await this.request<any>(`/bulletins/${id}/valider`, {
      method: 'PATCH',
    });
    return mapBulletin(raw);
  }

  async payerBulletin(id: string) {
    const raw = await this.request<any>(`/bulletins/${id}/payer`, {
      method: 'PATCH',
    });
    return mapBulletin(raw);
  }

  // ── Paramètres ────────────────────────────────────────────────────────────

  async getParametres() {
    const raw = await this.request<any>('/parametres');
    return mapParametres(raw);
  }

  async updateParametres(data: any) {
    const raw = await this.request<any>('/parametres', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapParametres(raw);
  }

  async resetParametres() {
    const raw = await this.request<any>('/parametres/reset', {
      method: 'POST',
    });
    return mapParametres(raw);
  }

  // ── Rapports ──────────────────────────────────────────────────────────────

  async getRapportGlobal() {
    return this.request<any>('/rapports/global');
  }

  async getRapportParDepartement() {
    return this.request<any[]>('/rapports/departements');
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  async getNotifications() {
    const raw = await this.request<any[]>('/notifications');
    return (raw ?? []).map(mapNotification);
  }

  async createNotification(data: { type: string; titre: string; message: string }) {
    return this.request<any>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markNotificationAsRead(id: string) {
    return this.request<void>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<void>('/notifications/read/all', {
      method: 'PATCH',
    });
  }

  // ── Primes (Bonus) ──────────────────────────────────────────────────────

  async getPrimes() {
    const raw = await this.request<any[]>('/primes');
    return (raw ?? []).map(this.mapPrime);
  }

  async getPrime(id: string) {
    const raw = await this.request<any>(`/primes/${id}`);
    return this.mapPrime(raw);
  }

  async createPrime(data: any) {
    const raw = await this.request<any>('/primes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.mapPrime(raw);
  }

  async updatePrime(id: string, data: any) {
    const raw = await this.request<any>(`/primes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return this.mapPrime(raw);
  }

  async togglePrime(id: string) {
    const raw = await this.request<any>(`/primes/${id}/toggle`, {
      method: 'PATCH',
    });
    return this.mapPrime(raw);
  }

  async deletePrime(id: string) {
    await this.request<void>(`/primes/${id}`, {
      method: 'DELETE',
    });
  }

  mapPrime(raw: any) {
    if (!raw) return raw;
    return {
      id: raw.id,
      libelle: raw.libelle,
      type: raw.type,
      cible: raw.cible || null,
      employeId: raw.employe_id || raw.employeId || null,
      departementId: raw.departement_id || raw.departementId || null,
      mode: raw.mode,
      valeur: parseFloat(raw.valeur ?? 0),
      actif: !!(raw.actif),
      dateDebut: raw.date_debut ? raw.date_debut.split('T')[0] : (raw.dateDebut || ''),
      dateFin: raw.date_fin ? raw.date_fin.split('T')[0] : (raw.dateFin || null),
      description: raw.description || '',
      creeLe: raw.cree_le || raw.creeLe || new Date().toISOString(),
    };
  }

  // ── Salaire Historique ─────────────────────────────────────────────────────

  async getHistoriqueSalaire(employeId: string) {
    const raw = await this.request<any[]>(`/salaire-historique/${employeId}`);
    return (raw ?? []).map((r: any) => ({
      id: r.id,
      employeId: r.employe_id || r.employeId,
      typeChangement: r.type_changement || r.typeChangement,
      ancienSalaire: parseFloat(r.ancien_salaire ?? r.ancienSalaire ?? 0),
      nouveauSalaire: parseFloat(r.nouveau_salaire ?? r.nouveauSalaire ?? 0),
      ancienPoste: r.ancien_poste || r.ancienPoste || null,
      nouveauPoste: r.nouveau_poste || r.nouveauPoste || null,
      motif: r.motif || '',
      periodeEffet: r.periode_effet || r.periodeEffet || '',
      creeLe: r.cree_le || r.creeLe || new Date().toISOString(),
    }));
  }

  async ajouterChangementSalaire(employeId: string, data: {
    typeChangement: string;
    nouveauSalaire?: number;
    nouveauPoste?: string;
    motif?: string;
    periodeEffet: string;
  }) {
    const raw = await this.request<any>(`/salaire-historique/${employeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return raw;
  }

  // ── Mouvements (suspension, licenciement, départ, démission) ──────────

  async getMouvements(params?: { employeId?: string; type?: string; actif?: boolean }) {
    const query = params ? new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    ).toString() : '';
    const raw = await this.request<any[]>(`/mouvements${query ? `?${query}` : ''}`);
    return (raw ?? []).map(this.mapMouvement);
  }

  async getMouvement(id: string) {
    const raw = await this.request<any>(`/mouvements/${id}`);
    return this.mapMouvement(raw);
  }

  async getMouvementsByEmploye(employeId: string) {
    const raw = await this.request<any[]>(`/mouvements/employe/${employeId}`);
    return (raw ?? []).map(this.mapMouvement);
  }

  async getMouvementsActifsByEmploye(employeId: string) {
    const raw = await this.request<any[]>(`/mouvements/employe/${employeId}/actifs`);
    return (raw ?? []).map(this.mapMouvement);
  }

  async getMouvementsRecents(limit = 10) {
    const raw = await this.request<any[]>(`/mouvements/recents?limit=${limit}`);
    return (raw ?? []).map(this.mapMouvement);
  }

  async createMouvement(data: {
    employeId: string;
    type: string;
    motif: string;
    dateDebut: string;
    dateFin?: string;
    indemnite?: number;
    pourcentageRemuneration?: number;
  }) {
    const raw = await this.request<any>('/mouvements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.mapMouvement(raw);
  }

  async updateMouvement(id: string, data: any) {
    const raw = await this.request<any>(`/mouvements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return this.mapMouvement(raw);
  }

  async desactiverMouvement(id: string) {
    const raw = await this.request<any>(`/mouvements/${id}/desactiver`, {
      method: 'PATCH',
    });
    return this.mapMouvement(raw);
  }

  async deleteMouvement(id: string) {
    await this.request<void>(`/mouvements/${id}`, {
      method: 'DELETE',
    });
  }

  mapMouvement(raw: any) {
    if (!raw) return raw;
    return {
      id: raw.id,
      employeId: raw.employe_id || raw.employeId,
      type: raw.type,
      motif: raw.motif,
      dateDebut: raw.date_debut ? raw.date_debut.split('T')[0] : (raw.dateDebut || ''),
      dateFin: raw.date_fin ? raw.date_fin.split('T')[0] : (raw.dateFin || null),
      indemnite: parseFloat(raw.indemnite ?? 0),
      pourcentageRemuneration: raw.pourcentage_remuneration ? parseFloat(raw.pourcentage_remuneration) : (raw.pourcentageRemuneration || null),
      actif: !!(raw.actif),
      creeLe: raw.cree_le || raw.creeLe || new Date().toISOString(),
      modifieLe: raw.modifie_le || raw.modifieLe || new Date().toISOString(),
      employeNom: raw.employeNom || null,
      employeMatricule: raw.employeMatricule || null,
    };
  }

  // ── Congés ──────────────────────────────────────────────────────────────

  async getConges(params?: { employeId?: string; actif?: boolean }) {
    const query = params ? new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    ).toString() : '';
    const raw = await this.request<any[]>(`/conges${query ? `?${query}` : ''}`);
    return (raw ?? []).map(this.mapConge);
  }

  async getConge(id: string) {
    const raw = await this.request<any>(`/conges/${id}`);
    return this.mapConge(raw);
  }

  async getCongesByEmploye(employeId: string) {
    const raw = await this.request<any[]>(`/conges/employe/${employeId}`);
    return (raw ?? []).map(this.mapConge);
  }

  async getCongesActifsByEmploye(employeId: string) {
    const raw = await this.request<any[]>(`/conges/employe/${employeId}/actifs`);
    return (raw ?? []).map(this.mapConge);
  }

  async createConge(data: {
    employeId: string;
    libelle: string;
    motif?: string;
    dateDebut: string;
    dateFin: string;
    pourcentageRemuneration?: number;
  }) {
    const raw = await this.request<any>('/conges', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.mapConge(raw);
  }

  async updateConge(id: string, data: any) {
    const raw = await this.request<any>(`/conges/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return this.mapConge(raw);
  }

  async desactiverConge(id: string) {
    const raw = await this.request<any>(`/conges/${id}/desactiver`, {
      method: 'PATCH',
    });
    return this.mapConge(raw);
  }

  async deleteConge(id: string) {
    await this.request<void>(`/conges/${id}`, {
      method: 'DELETE',
    });
  }

  mapConge(raw: any) {
    if (!raw) return raw;
    return {
      id: raw.id,
      employeId: raw.employe_id || raw.employeId,
      libelle: raw.libelle,
      motif: raw.motif || null,
      dateDebut: raw.date_debut ? raw.date_debut.split('T')[0] : (raw.dateDebut || ''),
      dateFin: raw.date_fin ? raw.date_fin.split('T')[0] : (raw.dateFin || ''),
      pourcentageRemuneration: parseFloat(raw.pourcentage_remuneration ?? raw.pourcentageRemuneration ?? 100),
      actif: !!(raw.actif),
      creeLe: raw.cree_le || raw.creeLe || new Date().toISOString(),
      modifieLe: raw.modifie_le || raw.modifieLe || new Date().toISOString(),
      employeNom: raw.employeNom || null,
      employeMatricule: raw.employeMatricule || null,
    };
  }

  // ── Départements ──────────────────────────────────────────────────────────

  async getDepartements() {
    const raw = await this.request<any[]>('/departements');
    return raw ?? [];
  }

  async createDepartement(nom: string) {
    return this.request<any>('/departements', {
      method: 'POST',
      body: JSON.stringify({ nom }),
    });
  }

  async updateDepartement(id: string, nom: string) {
    return this.request<any>(`/departements/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nom }),
    });
  }

  async deleteDepartement(id: string) {
    return this.request<void>(`/departements/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
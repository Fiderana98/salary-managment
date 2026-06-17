import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Employe, BulletinPaie, ParametresPaie, Notification, Theme, Mouvement, Conge } from '../types';
import { api } from '../services/api';

const parametresDefaut: ParametresPaie = {
  sme_non_agricole: 262680,
  sme_agricole: 266500,
  plafond_multiplier: 8,
  cnaps_salarial: 0.01,
  cnaps_patronal: 0.13,
  ostie_salariale: 0.01,
  ostie_patronale: 0.05,
  fmfp_patronal: 0.01,
  tranches_irsa: [
    { min: 0, max: 350000, taux: 0 },
    { min: 350000, max: 400000, taux: 0.05 },
    { min: 400000, max: 500000, taux: 0.10 },
    { min: 500000, max: 600000, taux: 0.15 },
    { min: 600000, max: null, taux: 0.20 },
  ],
  heures_travail_mensuel: 173.33,
  taux_heure_supplementaire: 1.30,
  prime_anciennete_taux: 0,
  prime_transport_defaut: 0,
};

interface AppContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  departements: { id: string; nom: string }[];
  loadDepartements: () => Promise<void>;
  refreshDepartements: () => Promise<void>;
  addDepartement: (nom: string) => Promise<void>;
  updateDepartement: (id: string, nom: string) => Promise<void>;
  deleteDepartement: (id: string) => Promise<void>;
  employes: Employe[];
  addEmploye: (e: Omit<Employe, 'id' | 'matricule'>) => Promise<void>;
  updateEmploye: (e: Employe) => Promise<void>;
  deleteEmploye: (id: string) => Promise<void>;
  getEmploye: (id: string) => Employe | undefined;
  refreshEmployes: () => Promise<void>;
  bulletins: BulletinPaie[];
  genererBulletinsMensuel: (periode: string, force: boolean) => Promise<void>;
  validerBulletin: (id: string) => Promise<void>;
  payerBulletin: (id: string) => Promise<void>;
  getBulletinsEmploye: (employeId: string) => BulletinPaie[];
  getBulletinsPeriode: (periode: string) => BulletinPaie[];
  parametres: ParametresPaie;
  updateParametres: (p: ParametresPaie) => Promise<void>;
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'date' | 'lu'>) => void;
  marquerLu: (id: string) => Promise<void>;
  marquerTousLu: () => Promise<void>;
  currentPage: string;
  setCurrentPage: (p: string) => void;
  currentEmployeId: string | null;
  setCurrentEmployeId: (id: string | null) => void;
  // Mouvements
  mouvements: Mouvement[];
  loadMouvements: (params?: { employeId?: string }) => Promise<void>;
  createMouvement: (data: any) => Promise<Mouvement>;
  updateMouvement: (id: string, data: any) => Promise<Mouvement>;
  desactiverMouvement: (id: string) => Promise<void>;
  // Congés
  conges: Conge[];
  loadConges: (params?: { employeId?: string }) => Promise<void>;
  createConge: (data: any) => Promise<Conge>;
  updateConge: (id: string, data: any) => Promise<Conge>;
  desactiverConge: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('gs_theme');
    return (stored as Theme) || 'light';
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [bulletins, setBulletins] = useState<BulletinPaie[]>([]);
  const [parametres, setParametres] = useState<ParametresPaie>(parametresDefaut);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentEmployeId, setCurrentEmployeId] = useState<string | null>(null);
  const [departements, setDepartements] = useState<{ id: string; nom: string }[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [conges, setConges] = useState<Conge[]>([]);

  // Thème
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('gs_theme', theme);
  }, [theme]);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await api.getCurrentUser();
          setIsAuthenticated(true);
          await loadInitialData();
        } catch {
          api.clearToken();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const loadInitialData = async () => {
    try {
      const [employesData, bulletinsData, parametresData, notificationsData, departementsData] = await Promise.all([
        api.getEmployes().catch(() => []),
        api.getBulletins().catch(() => []),
        api.getParametres().catch(() => null),
        api.getNotifications().catch(() => []),
        api.getDepartements().catch(() => []),
      ]);
      setEmployes(employesData ?? []);
      setBulletins(bulletinsData ?? []);
        // Previously the update was conditioned on a non‑existent `sme_non_agricole`
        // property, preventing the fetched parameters from being stored in state.
        // The ParametresPaie model does not contain this field, so we should always
        // update the context when data is returned from the API.
        if (parametresData) {
          setParametres(parametresData);
        }
      setNotifications(notificationsData ?? []);
      setDepartements(departementsData ?? []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const refreshEmployes = useCallback(async () => {
    try {
      const employesData = await api.getEmployes();
      setEmployes(employesData ?? []);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des employés:', error);
    }
  }, []);

  // Départements
  const loadDepartements = useCallback(async () => {
    try {
      const data = await api.getDepartements();
      setDepartements(data);
    } catch (error) {
      console.error('Erreur chargement départements:', error);
    }
  }, []);

  const refreshDepartements = loadDepartements;

  const addDepartement = useCallback(async (nom: string) => {
    const newDept = await api.createDepartement(nom);
    setDepartements(prev => [...prev, newDept]);
  }, []);

  const updateDepartement = useCallback(async (id: string, nom: string) => {
    const updated = await api.updateDepartement(id, nom);
    setDepartements(prev => prev.map(d => d.id === id ? updated : d));
  }, []);

  const deleteDepartement = useCallback(async (id: string) => {
    await api.deleteDepartement(id);
    setDepartements(prev => prev.filter(d => d.id !== id));
  }, []);

  // Auth
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      await api.login(email, password);
      setIsAuthenticated(true);
      await loadInitialData();
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setIsAuthenticated(false);
    setEmployes([]);
    setBulletins([]);
    setNotifications([]);
    setDepartements([]);
    setMouvements([]);
    setConges([]);
    setCurrentPage('dashboard');
  }, []);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState(prev => (prev === 'light' ? 'dark' : 'light')),
    []
  );

  // Notifications
  const addNotification = useCallback((n: Omit<Notification, 'id' | 'date' | 'lu'>) => {
    // Déterminer si la notification doit être enregistrée dans l'historique
    const shouldPersist = (() => {
      // Toujours persister les erreurs
      if (n.type === 'error') return true;
      // Titres des actions importantes à persister
      const importantTitles = [
        'Bulletins générés',
        'Bulletin validé',
        'Paiement effectué',
        'Employé ajouté',
        'Employé modifié',
        'Employé supprimé',
        'Département ajouté',
        'Département modifié',
        'Département supprimé',
        'Paramètres mis à jour',
      ];
      return importantTitles.some(t => n.titre?.includes(t));
    })();

    const newNotif: Notification = {
      ...n,
      id: `temp_${Date.now()}`,
      date: new Date().toISOString(),
      lu: false,
    };

    if (shouldPersist) {
      setNotifications(prev => [newNotif, ...prev]);
    } else {
      // Afficher un toast rapide pour les notifications non persistantes
      // Supposons qu'une fonction toast existe dans l'application (ex: toast.info)
      // On l'appelle de façon sécurisée si disponible
      if (typeof (window as any).toast === 'function') {
        (window as any).toast(n.titre || n.message || 'Notification');
      }
    }
    // Enregistrement côté serveur (peut être ignoré côté client si non persistant)
    api.createNotification(n).catch(console.error);
  }, []);

  // Employés
  const addEmploye = useCallback(async (e: Omit<Employe, 'id' | 'matricule'>) => {
    try {
      const newEmploye = await api.createEmploye(e);
      await refreshEmployes();
      addNotification({
        type: 'success',
        titre: 'Employé ajouté',
        message: `${newEmploye.nom} ${newEmploye.prenom} a été ajouté.`,
      });
      return newEmploye;
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      addNotification({
        type: 'error',
        titre: 'Erreur',
        message: "Impossible d'ajouter l'employé.",
      });
      throw error;
    }
  }, [addNotification, refreshEmployes]);

  const updateEmploye = useCallback(async (e: Employe) => {
    try {
      const updated = await api.updateEmploye(e.id, e);
      setEmployes(prev => prev.map(emp => (emp.id === e.id ? updated : emp)));
      addNotification({
        type: 'success',
        titre: 'Employé modifié',
        message: `${updated.nom} ${updated.prenom} a été modifié.`,
      });
      return updated;
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      addNotification({
        type: 'error',
        titre: 'Erreur',
        message: "Impossible de modifier l'employé.",
      });
      throw error;
    }
  }, [addNotification]);

  const deleteEmploye = useCallback(async (id: string) => {
    const employe = employes.find(e => e.id === id);
    try {
      await api.deleteEmploye(id);
      setEmployes(prev => prev.filter(e => e.id !== id));
      setBulletins(prev => prev.filter(b => b.employeId !== id));
      addNotification({
        type: 'success',
        titre: 'Employé supprimé',
        message: `${employe?.nom} ${employe?.prenom} a été supprimé.`,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addNotification({
        type: 'error',
        titre: 'Erreur',
        message: "Impossible de supprimer l'employé.",
      });
      throw error;
    }
  }, [employes, addNotification]);

  const getEmploye = useCallback((id: string) => employes.find(x => x.id === id), [employes]);

  // Bulletins
  const genererBulletinsMensuel = useCallback(async (periode: string, force: boolean = false) => {
    const result = await api.genererBulletins(periode, force);
    const nouveauxBulletins = await api.getBulletins({ periode });
    setBulletins(prev => [
      ...prev.filter(b => b.periode !== periode),
      ...nouveauxBulletins,
    ]);
    addNotification({
      type: 'success',
      titre: 'Bulletins générés',
      message: result.message || `${result.bulletins?.length || 0} bulletins générés.`,
    });
  }, [addNotification]);

  const validerBulletin = useCallback(async (id: string) => {
    const bulletinValide = await api.validerBulletin(id);
    setBulletins(prev => prev.map(b => (b.id === id ? bulletinValide : b)));
    // Notification individuelle de validation supprimée pour éviter la saturation
  }, [addNotification]);

  const payerBulletin = useCallback(async (id: string) => {
    const bulletinPaye = await api.payerBulletin(id);
    setBulletins(prev => prev.map(b => (b.id === id ? bulletinPaye : b)));
    // Notification individuelle de paiement supprimée pour éviter la saturation
  }, [addNotification]);

  const getBulletinsEmploye = useCallback(
    (employeId: string) => bulletins.filter(b => b.employeId === employeId),
    [bulletins]
  );
  const getBulletinsPeriode = useCallback(
    (periode: string) => bulletins.filter(b => b.periode === periode),
    [bulletins]
  );

  // Paramètres
  const updateParametres = useCallback(async (p: ParametresPaie) => {
    const paramsUpdated = await api.updateParametres(p);
    setParametres(paramsUpdated);
    addNotification({
      type: 'success',
      titre: 'Paramètres mis à jour',
      message: 'Les paramètres ont été enregistrés.',
    });
  }, [addNotification]);

  // Notifications
  const marquerLu = useCallback(async (id: string) => {
    // Marquer comme lu côté serveur puis rafraîchir la liste depuis le serveur
    await api.markNotificationAsRead(id);
    // Recharger les notifications pour garantir la cohérence
    const refreshed = await api.getNotifications();
    setNotifications(refreshed ?? []);
  }, []);

  const marquerTousLu = useCallback(async () => {
    // Marquer toutes les notifications comme lues côté serveur puis recharger
    await api.markAllNotificationsAsRead();
    const refreshed = await api.getNotifications();
    setNotifications(refreshed ?? []);
  }, []);

  // Mouvements
  const loadMouvements = useCallback(async (params?: { employeId?: string }) => {
    try {
      const data = params?.employeId
        ? await api.getMouvementsByEmploye(params.employeId)
        : await api.getMouvements();
      setMouvements(data ?? []);
    } catch (error) {
      console.error('Erreur chargement mouvements:', error);
    }
  }, []);

  const createMouvement = useCallback(async (data: any): Promise<Mouvement> => {
    const newMouvement = await api.createMouvement(data);
    setMouvements(prev => [newMouvement, ...prev]);
    await refreshEmployes();
    return newMouvement;
  }, [refreshEmployes]);

  const updateMouvement = useCallback(async (id: string, data: any): Promise<Mouvement> => {
    const updated = await api.updateMouvement(id, data);
    setMouvements(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  }, []);

  const desactiverMouvement = useCallback(async (id: string) => {
    await api.desactiverMouvement(id);
    setMouvements(prev => prev.map(m => m.id === id ? { ...m, actif: false } : m));
    await refreshEmployes();
  }, [refreshEmployes]);

  // Congés
  const loadConges = useCallback(async (params?: { employeId?: string }) => {
    try {
      const data = params?.employeId
        ? await api.getCongesByEmploye(params.employeId)
        : await api.getConges();
      setConges(data ?? []);
    } catch (error) {
      console.error('Erreur chargement congés:', error);
    }
  }, []);

  const createConge = useCallback(async (data: any): Promise<Conge> => {
    const newConge = await api.createConge(data);
    setConges(prev => [newConge, ...prev]);
    await refreshEmployes();
    return newConge;
  }, [refreshEmployes]);

  const updateConge = useCallback(async (id: string, data: any): Promise<Conge> => {
    const updated = await api.updateConge(id, data);
    setConges(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  }, []);

  const desactiverConge = useCallback(async (id: string) => {
    await api.desactiverConge(id);
    setConges(prev => prev.map(c => c.id === id ? { ...c, actif: false } : c));
    await refreshEmployes();
  }, [refreshEmployes]);

  const value: AppContextType = {
    theme,
    setTheme,
    toggleTheme,
    loading,
    isAuthenticated,
    login,
    logout,
    departements,
    loadDepartements,
    refreshDepartements,
    addDepartement,
    updateDepartement,
    deleteDepartement,
    employes,
    addEmploye,
    updateEmploye,
    deleteEmploye,
    getEmploye,
    refreshEmployes,
    bulletins,
    genererBulletinsMensuel,
    validerBulletin,
    payerBulletin,
    getBulletinsEmploye,
    getBulletinsPeriode,
    parametres,
    updateParametres,
    notifications,
    addNotification,
    marquerLu,
    marquerTousLu,
    currentPage,
    setCurrentPage,
    currentEmployeId,
    setCurrentEmployeId,
    mouvements,
    loadMouvements,
    createMouvement,
    updateMouvement,
    desactiverMouvement,
    conges,
    loadConges,
    createConge,
    updateConge,
    desactiverConge,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
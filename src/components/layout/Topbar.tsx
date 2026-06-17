import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useApp } from '../../context/AppContext';
import { formatDateLong } from '../../utils/format';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const pageLabels: Record<string, string> = {
  dashboard: 'Tableau de bord',
  employes: 'Gestion des employés',
  departements: 'Gestion des départements',  // NOUVEAU
  bulletins: 'Bulletins de paie',
  rapports: 'Rapports & Analyses',
  parametres: 'Paramètres du système',
  fiche_employe: 'Fiche employé',
};

export default function Topbar() {
  const navigate = useNavigate();
  // Note: le contexte expose `marquerTousLu` (sans "s"). Utilisons le bon nom.
  const { theme, toggleTheme, notifications, marquerLu, marquerTousLu, currentPage } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter(n => !n.lu).length;
  const today = formatDateLong(new Date().toISOString());

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    api.logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'success': return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
          <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
      );
      case 'warning': return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/30">
          <svg className="h-3.5 w-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
        </div>
      );
      case 'error': return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
          <svg className="h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
      );
      default: return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
          <svg className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      );
    }
  };

  return (
    <header className="fixed left-56 right-0 top-0 h-14 z-30 flex items-center justify-between px-6 border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/90">
      {/* Left */}
      <div>
        <h1 className="text-sm font-semibold text-slate-900 dark:text-white">{pageLabels[currentPage] || 'GestionSalaire'}</h1>
        <p className="text-[11px] text-slate-400">{today}</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme toggle - Correction ici */}
        <button
          onClick={toggleTheme} // Utilisez directement toggleTheme du contexte
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
        >
          {theme === 'dark' ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          aria-label="Déconnexion"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(prev => !prev)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={`Notifications — ${unread} non lues`}
            aria-expanded={notifOpen}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-10 w-80 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800 overflow-hidden"
                role="dialog"
                aria-label="Panneau de notifications"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
                  {unread > 0 && (
                    <button onClick={marquerTousLu} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                      Tout marquer lu
                    </button>
                  )}
                </div>
                <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700" role="list">
                  {notifications.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm text-slate-400">Aucune notification</li>
                  ) : (
                    notifications.map(n => (
                      <li key={n.id}>
                        <button
                          onClick={() => marquerLu(n.id)}
                          className={cn(
                            'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors',
                            !n.lu && 'bg-indigo-50/40 dark:bg-indigo-900/10',
                          )}
                        >
                          {typeIcon(n.type)}
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-xs font-semibold truncate', !n.lu ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300')}>{n.titre}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                          </div>
                          {!n.lu && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
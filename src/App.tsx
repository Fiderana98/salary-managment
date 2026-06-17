import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Dashboard from './pages/Dashboard';
import Employes from './pages/Employes';
import Bulletins from './pages/Bulletins';
import Rapports from './pages/Rapports';
import Primes from './pages/Primes';
import Parametres from './pages/Parametres';
import FicheEmploye from './pages/FicheEmploye';
import Departements from './pages/Departements';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

// Composant de protection des routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useApp();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Composant wrapper pour les pages protégées
function ProtectedLayout() {
  const { currentPage, theme } = useApp(); // Gardez theme ici car utilisé pour le Toaster

  const pageVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'employes': return <Employes />;
      case 'fiche_employe': return <FicheEmploye />;
      case 'bulletins': return <Bulletins />;
      case 'rapports': return <Rapports />;
      case 'primes': return <Primes />;
      case 'parametres': return <Parametres />;
      case 'departements': return <Departements/>;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950"> {/* Plus de conditionnel theme ici */}
      <Sidebar />
      <Topbar />
      <main
        className="ml-56 pt-14 min-h-screen"
        id="main-content"
        aria-label="Contenu principal"
      >
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '10px',
            background: theme === 'dark' ? '#1e293b' : '#fff',
            color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          },
        }}
      />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <ProtectedLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
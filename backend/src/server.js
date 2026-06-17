const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

// Vérifier que JWT_SECRET existe
if (!process.env.JWT_SECRET) {
  console.error('ERREUR: JWT_SECRET non défini dans le fichier .env');
  console.error('Génération d\'une clé temporaire pour le développement...');
  process.env.JWT_SECRET = 'dev_secret_key_' + Math.random().toString(36).substring(2);
}

// Routes
const authRoutes = require('./routes/authRoutes');
const employeRoutes = require('./routes/employeRoutes');
const bulletinRoutes = require('./routes/bulletinRoutes');
const parametresRoutes = require('./routes/parametresRoutes');
const rapportsRoutes = require('./routes/rapportsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const departementRoutes = require('./routes/departementRoutes');
const primeRoutes = require('./routes/primeRoutes');
const salaireHistoriqueRoutes = require('./routes/salaireHistoriqueRoutes');
const mouvementRoutes = require('./routes/mouvementRoutes');
const congeRoutes = require('./routes/congeRoutes');

const app = express();

// CORS - DOIT ÊTRE AVANT tout autre middleware pour les preflight OPTIONS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Rate limiting - AFTER CORS to allow preflight requests
// En développement, on autorise beaucoup plus de requêtes pour éviter les blocages
const isDev = process.env.NODE_ENV === 'development';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  // Ignorer les requêtes OPTIONS (preflight CORS)
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employes', employeRoutes);
app.use('/api/bulletins', bulletinRoutes);
app.use('/api/parametres', parametresRoutes);
app.use('/api/rapports', rapportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/departements', departementRoutes);
app.use('/api/primes', primeRoutes);
app.use('/api/salaire-historique', salaireHistoriqueRoutes);
app.use('/api/mouvements', mouvementRoutes);
app.use('/api/conges', congeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Une erreur interne est survenue' });
});

const PORT = process.env.PORT || 5000;
// Fonction pour désactiver automatiquement les mouvements expirés
const deactivateExpiredMouvements = async () => {
  try {
    // Met à jour les mouvements dont la date de fin est passée et qui sont encore actifs
    await require('./models/Mouvement').desactiverExpired();
    console.log('✅ Vérification des mouvements expirés effectuée');
  } catch (err) {
    console.error('Erreur lors de la désactivation des mouvements expirés :', err);
  }
};

// Planifier la vérification quotidienne (à minuit)
const scheduleDailyCheck = () => {
  const msInDay = 24 * 60 * 60 * 1000;
  const now = new Date();
  // Calcul du temps restant jusqu'à minuit
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const delay = nextMidnight - now;
  setTimeout(() => {
    deactivateExpiredMouvements();
    setInterval(deactivateExpiredMouvements, msInDay);
  }, delay);
};

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✓ Configuré' : '✗ Non configuré'}`);
  // Démarrer la tâche de désactivation automatique
  scheduleDailyCheck();
});

module.exports = app;
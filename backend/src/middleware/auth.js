const { verifyToken } = require('../config/jwt');

function authentifier(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Token d'authentification requis" });
  }

  const token = authHeader.split(' ')[1];
  const utilisateur = verifyToken(token);
  
  if (!utilisateur) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }

  req.utilisateur = utilisateur;
  next();
}

function autoriser(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.utilisateur?.role)) {
      return res.status(403).json({ error: 'Accès non autorisé pour votre rôle' });
    }
    next();
  };
}

module.exports = {
  authentifier,
  autoriser,
};
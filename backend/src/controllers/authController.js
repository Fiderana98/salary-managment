const User = require('../models/User');
const { generateToken } = require('../config/jwt');

exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    
    if (!email || !motDePasse) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    
    const isValid = await User.comparePassword(motDePasse, user.mot_de_passe);
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    
    await User.updateLastLogin(user.id);
    
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    
    res.json({
      token,
      utilisateur: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.utilisateur.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
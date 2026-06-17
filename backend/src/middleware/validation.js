// middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

const valider = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Erreurs de validation:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation pour la création
const validateCreateEmploye = [
  // Accepter 'nom' ou 'nom' directement
  body('nom').notEmpty().withMessage('Le nom est requis').trim(),
  body('prenom').notEmpty().withMessage('Le prénom est requis').trim(),
  body('dateEmbauche').notEmpty().withMessage("La date d'embauche est requise"),
  body('poste').notEmpty().withMessage('Le poste est requis'),
  body('salaireBrut').isNumeric().withMessage('Le salaire brut doit être un nombre'),
  body('email').optional().isEmail().withMessage('Email invalide'),
  valider,
];

// Validation pour la mise à jour (champs optionnels)
const validateUpdateEmploye = [
  body('nom').optional().notEmpty().withMessage('Le nom ne peut pas être vide').trim(),
  body('prenom').optional().notEmpty().withMessage('Le prénom ne peut pas être vide').trim(),
  body('dateEmbauche').optional(),
  body('poste').optional().notEmpty().withMessage('Le poste ne peut pas être vide'),
  body('salaireBrut').optional().isNumeric().withMessage('Le salaire brut doit être un nombre'),
  body('email').optional().isEmail().withMessage('Email invalide'),
  valider,
];

const validatePeriode = [
  param('periode').matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('Format période invalide (YYYY-MM)'),
  valider,
];

module.exports = {
  valider,
  validateCreateEmploye,
  validateUpdateEmploye,
  validatePeriode,
};
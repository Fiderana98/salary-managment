const express = require('express');
const router = express.Router();
const {
  getHistorique,
  ajouterChangement,
} = require('../controllers/salaireHistoriqueController');
const { authentifier, autoriser } = require('../middleware/auth');

router.use(authentifier);

router.get('/:employeId', getHistorique);
router.post('/:employeId', autoriser('admin', 'rh'), ajouterChangement);

module.exports = router;
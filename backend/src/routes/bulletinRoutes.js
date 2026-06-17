const express = require('express');
const router = express.Router();
const {
  getAllBulletins,
  getBulletinById,
  genererBulletins,
  validerBulletin,
  payerBulletin,
  getStatsBulletins,
} = require('../controllers/bulletinController');
const { authentifier, autoriser } = require('../middleware/auth');
const { validatePeriode } = require('../middleware/validation');

router.use(authentifier);

router.get('/', getAllBulletins);
router.get('/stats', getStatsBulletins);
router.get('/:id', getBulletinById);
router.post('/generer', autoriser('admin', 'rh'), genererBulletins);
router.patch('/:id/valider', autoriser('admin', 'rh'), validerBulletin);
router.patch('/:id/payer', autoriser('admin', 'comptable'), payerBulletin);

module.exports = router;
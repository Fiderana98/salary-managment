const express = require('express');
const router = express.Router();
const {
  getParametres,
  updateParametres,
  resetParametres,
} = require('../controllers/parametresController');
const { authentifier, autoriser } = require('../middleware/auth');

router.use(authentifier);

router.get('/', getParametres);
router.put('/', autoriser('admin'), updateParametres);
router.post('/reset', autoriser('admin'), resetParametres);

module.exports = router;
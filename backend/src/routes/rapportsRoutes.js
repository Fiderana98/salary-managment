const express = require('express');
const router = express.Router();
const {
  getRapportGlobal,
  getRapportParDepartement,
} = require('../controllers/rapportsController');
const { authentifier } = require('../middleware/auth');

router.use(authentifier);

router.get('/global', getRapportGlobal);
router.get('/departements', getRapportParDepartement);

module.exports = router;
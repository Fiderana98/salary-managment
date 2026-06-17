const express = require('express');
const router = express.Router();
const primeController = require('../controllers/primeController');
const { authentifier } = require('../middleware/auth');

router.use(authentifier);

router.get('/', primeController.getAll);
router.get('/by-employe', primeController.getByEmploye);
router.get('/:id', primeController.getById);
router.post('/', primeController.create);
router.put('/:id', primeController.update);
router.patch('/:id/toggle', primeController.toggleActif);
router.delete('/:id', primeController.remove);

module.exports = router;
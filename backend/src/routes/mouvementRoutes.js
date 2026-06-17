const express = require('express');
const router = express.Router();
const mouvementController = require('../controllers/mouvementController');
const { authentifier } = require('../middleware/auth');

router.use(authentifier);

router.get('/', mouvementController.getAll);
router.get('/recents', mouvementController.getRecents);
router.get('/employe/:employeId', mouvementController.getByEmploye);
router.get('/employe/:employeId/actifs', mouvementController.getActifsByEmploye);
router.get('/:id', mouvementController.getById);
router.post('/', mouvementController.create);
router.put('/:id', mouvementController.update);
router.patch('/:id/desactiver', mouvementController.desactiver);
router.delete('/:id', mouvementController.remove);

module.exports = router;
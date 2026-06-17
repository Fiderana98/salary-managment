const express = require('express');
const router = express.Router();
const congeController = require('../controllers/congeController');
const { authentifier } = require('../middleware/auth');

router.use(authentifier);

router.get('/', congeController.getAll);
router.get('/employe/:employeId', congeController.getByEmploye);
router.get('/employe/:employeId/actifs', congeController.getActifsByEmploye);
router.get('/:id', congeController.getById);
router.post('/', congeController.create);
router.put('/:id', congeController.update);
router.patch('/:id/desactiver', congeController.desactiver);
router.delete('/:id', congeController.remove);

module.exports = router;
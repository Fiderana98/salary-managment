const express = require('express');
const router = express.Router();
const {
  getAllDepartements,
  getDepartementById,
  createDepartement,
  updateDepartement,
  deleteDepartement,
} = require('../controllers/departementController');
const { authentifier, autoriser } = require('../middleware/auth');

router.use(authentifier);
router.get('/', getAllDepartements);
router.get('/:id', getDepartementById);
router.post('/', autoriser('admin'), createDepartement);
router.put('/:id', autoriser('admin'), updateDepartement);
router.delete('/:id', autoriser('admin'), deleteDepartement);

module.exports = router;
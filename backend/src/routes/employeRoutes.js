const express = require('express');
const router = express.Router();
const {
  getAllEmployes,
  getEmployeById,
  createEmploye,
  updateEmploye,
  deleteEmploye,
  getStatsEmployes,
} = require('../controllers/employeController');
const { authentifier, autoriser } = require('../middleware/auth');
const { validateCreateEmploye, validateUpdateEmploye } = require('../middleware/validation');

router.use(authentifier);

router.get('/', getAllEmployes);
router.get('/stats', getStatsEmployes);
router.get('/:id', getEmployeById);
router.post('/', autoriser('admin', 'rh'), validateCreateEmploye, createEmploye);
router.put('/:id', autoriser('admin', 'rh'), validateUpdateEmploye, updateEmploye);
router.delete('/:id', autoriser('admin'), deleteEmploye);

module.exports = router;
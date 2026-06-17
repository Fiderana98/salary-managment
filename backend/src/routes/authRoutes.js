const express = require('express');
const router = express.Router();
const { login, me } = require('../controllers/authController');
const { authentifier } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', authentifier, me);

module.exports = router;
const express = require('express');
const router = express.Router();
const { registrar, login } = require('../controllers/authController');

// POST /api/auth/registro
router.post('/registro', registrar);

// POST /api/auth/login
router.post('/login', login);

module.exports = router;

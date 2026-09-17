const express = require('express');
const router = express.Router();
const {
  registrar,
  login,
  solicitarRecuperacion,
  restablecerPassword,
} = require('../controllers/authController');

// POST /api/auth/registro
router.post('/registro', registrar);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/solicitar-recuperacion
router.post('/solicitar-recuperacion', solicitarRecuperacion);

// POST /api/auth/restablecer-password
router.post('/restablecer-password', restablecerPassword);

module.exports = router;
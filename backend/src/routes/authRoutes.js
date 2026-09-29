const express = require('express');
const router = express.Router();
const { registrar, login } = require('../controllers/authController');
const {
  solicitarRecuperacion,
  verificarCodigo,
  restablecerPassword,
} = require('../controllers/recuperacionController');

// POST /api/auth/registro
router.post('/registro', registrar);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/solicitar-recuperacion  -> envía el código de 6 dígitos
router.post('/solicitar-recuperacion', solicitarRecuperacion);

// POST /api/auth/verificar-codigo        -> comprueba el código
router.post('/verificar-codigo', verificarCodigo);

// POST /api/auth/restablecer-password    -> cambia la contraseña con el código
router.post('/restablecer-password', restablecerPassword);

module.exports = router;

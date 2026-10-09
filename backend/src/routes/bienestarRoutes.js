const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { opciones, crearRegistro, registrosHoy } = require('../controllers/bienestarController');

// Todo el módulo es solo para estudiantes con sesión iniciada
router.use(verificarToken, verificarRol('estudiante'));

router.get('/opciones', opciones);        // GET  /api/bienestar/opciones
router.get('/hoy', registrosHoy);         // GET  /api/bienestar/hoy
router.post('/registro', crearRegistro);  // POST /api/bienestar/registro

module.exports = router;

const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const {
  listarServicios,
  listarProfesionales,
  obtenerHorarios,
  crearCita,
  misCitas,
  cancelarCita,
  citasProfesional,
  cambiarEstado,
  todasLasCitas,
} = require('../controllers/citasController');

// Todas las rutas de citas exigen sesión iniciada
router.use(verificarToken);

// Catálogos (GET /api/citas/servicios, /profesionales, /horarios)
router.get('/servicios', listarServicios);
router.get('/profesionales', listarProfesionales);
router.get('/horarios', obtenerHorarios);

// Estudiante
router.post('/', verificarRol('estudiante'), crearCita);
router.get('/mias', verificarRol('estudiante'), misCitas);
router.patch('/:id/cancelar', verificarRol('estudiante'), cancelarCita);

// Profesional
router.get('/profesional', verificarRol('profesional'), citasProfesional);
router.patch('/:id/estado', verificarRol('profesional'), cambiarEstado);

// Admin
router.get('/todas', verificarRol('admin'), todasLasCitas);

module.exports = router;

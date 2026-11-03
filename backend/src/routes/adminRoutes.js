const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const admin = require('../controllers/adminController');
const citas = require('../controllers/citasController');

// Solo administradores con sesión iniciada
router.use(verificarToken, verificarRol('admin'));

router.get('/resumen', admin.resumen);
router.get('/estadisticas', admin.estadisticas);

router.get('/estudiantes', admin.listarEstudiantes);
router.post('/estudiantes', admin.crearEstudiante);

router.get('/profesionales', admin.listarProfesionales);
router.post('/profesionales', admin.crearProfesional);

router.patch('/usuarios/:id/activo', admin.cambiarActivo);

router.get('/servicios', admin.listarServicios);
router.post('/servicios', admin.crearServicio);
router.put('/servicios/:id', admin.editarServicio);

// NUEVO: listado de todas las citas y horarios libres (reutilizan citasController)
router.get('/citas', citas.todasLasCitas);
router.get('/horarios', citas.obtenerHorarios);

router.post('/citas', admin.crearCita);
router.patch('/citas/:id/estado', admin.cambiarEstadoCita);

module.exports = router;

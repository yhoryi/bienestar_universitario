const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const {
  perfil,
  listarDisponibilidad,
  crearDisponibilidad,
  eliminarDisponibilidad,
} = require('../controllers/profesionalController');

// Solo profesionales con sesión iniciada
router.use(verificarToken, verificarRol('profesional'));

router.get('/perfil', perfil);                                    // GET    /api/profesional/perfil
router.get('/disponibilidad', listarDisponibilidad);              // GET    /api/profesional/disponibilidad
router.post('/disponibilidad', crearDisponibilidad);              // POST   /api/profesional/disponibilidad
router.delete('/disponibilidad/:id', eliminarDisponibilidad);     // DELETE /api/profesional/disponibilidad/:id

module.exports = router;

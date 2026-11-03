const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { listar, contador, marcarLeida, marcarTodas } = require('../controllers/notificacionesController');

// Cualquier rol con sesión iniciada: cada usuario solo ve sus propias notificaciones
router.use(verificarToken);

router.get('/', listar);                     // GET   /api/notificaciones
router.get('/contador', contador);           // GET   /api/notificaciones/contador
router.patch('/leer-todas', marcarTodas);    // PATCH /api/notificaciones/leer-todas
router.patch('/:id/leer', marcarLeida);      // PATCH /api/notificaciones/:id/leer

module.exports = router;

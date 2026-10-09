const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { enviarMensaje, historial } = require('../controllers/conversacionController');

router.use(verificarToken, verificarRol('estudiante'));

router.get('/historial', historial);     // GET  /api/conversacion/historial
router.post('/mensaje', enviarMensaje);  // POST /api/conversacion/mensaje

module.exports = router;

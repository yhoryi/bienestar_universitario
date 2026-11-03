const pool = require('../config/db');

const VENTANA_MINUTOS = 30; // no repetir la alerta del mismo estudiante dentro de esta ventana

// Avisa a los profesionales cuando un estudiante muestra señales de riesgo en la conversación.
// Destinatarios: profesionales activos de Psicología; si no hay, todos los profesionales activos.
// Devuelve { creada, motivo } y nunca lanza error hacia el chat (quien la llama debe usar try/catch).
const crearAlertaRiesgo = async (estudianteId) => {
  const reciente = await pool.query(
    `SELECT 1 FROM notificaciones
     WHERE tipo = 'alerta_riesgo' AND estudiante_id = $1
       AND fecha > NOW() - INTERVAL '${VENTANA_MINUTOS} minutes'
     LIMIT 1`,
    [estudianteId]
  );
  if (reciente.rowCount > 0) {
    return { creada: false, motivo: 'reciente' }; // el equipo ya fue avisado hace poco
  }

  const { rows: est } = await pool.query(
    `SELECT u.nombre, u.apellido
     FROM estudiantes e JOIN usuarios u ON u.id = e.usuario_id
     WHERE e.id = $1`,
    [estudianteId]
  );
  if (!est[0]) {
    return { creada: false, motivo: 'estudiante_no_encontrado' };
  }

  let { rows: destinatarios } = await pool.query(
    `SELECT p.usuario_id
     FROM profesionales p
     JOIN usuarios u ON u.id = p.usuario_id
     JOIN servicios s ON s.id = p.servicio_id
     WHERE u.activo = true AND s.nombre ILIKE 'psicolog%'`
  );

  if (destinatarios.length === 0) {
    ({ rows: destinatarios } = await pool.query(
      `SELECT p.usuario_id
       FROM profesionales p JOIN usuarios u ON u.id = p.usuario_id
       WHERE u.activo = true`
    ));
  }

  if (destinatarios.length === 0) {
    return { creada: false, motivo: 'sin_destinatarios' };
  }

  const mensaje =
    `ALERTA: ${est[0].nombre} ${est[0].apellido} podría estar en una situación de riesgo ` +
    `según su conversación en la plataforma. Requiere atención prioritaria.`;

  for (const d of destinatarios) {
    await pool.query(
      `INSERT INTO notificaciones (usuario_id, mensaje, tipo, estudiante_id)
       VALUES ($1, $2, 'alerta_riesgo', $3)`,
      [d.usuario_id, mensaje, estudianteId]
    );
  }

  return { creada: true, destinatarios: destinatarios.length };
};

module.exports = { crearAlertaRiesgo };

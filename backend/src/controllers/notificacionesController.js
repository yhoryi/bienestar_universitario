const pool = require('../config/db');

// Lista las últimas 50 notificaciones del usuario con sesión iniciada.
// Las alertas de riesgo sin atender van primero e incluyen los datos del estudiante.
// Los datos del estudiante solo se unen a notificaciones dirigidas a quien consulta.
const listar = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT n.id, n.mensaje, COALESCE(n.leida, false) AS leida, n.fecha,
              COALESCE(n.tipo, 'info') AS tipo, n.estudiante_id,
              u.nombre AS est_nombre, u.apellido AS est_apellido, u.email AS est_email,
              e.codigo_estudiantil AS est_codigo, e.carrera AS est_carrera,
              e.facultad AS est_facultad, e.semestre AS est_semestre
       FROM notificaciones n
       LEFT JOIN estudiantes e ON e.id = n.estudiante_id AND n.tipo = 'alerta_riesgo'
       LEFT JOIN usuarios u ON u.id = e.usuario_id
       WHERE n.usuario_id = $1
       ORDER BY
         CASE WHEN n.tipo = 'alerta_riesgo' AND COALESCE(n.leida, false) = false THEN 0 ELSE 1 END,
         n.fecha DESC, n.id DESC
       LIMIT 50`,
      [req.usuario.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en listar notificaciones:', error.message);
    res.status(500).json({ error: 'Error al cargar tus notificaciones' });
  }
};

// Contadores para el menú, y la última alerta de riesgo sin atender (para el aviso emergente)
const contador = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS no_leidas,
              COUNT(*) FILTER (WHERE tipo = 'alerta_riesgo')::int AS alertas_sin_leer
       FROM notificaciones
       WHERE usuario_id = $1 AND COALESCE(leida, false) = false`,
      [req.usuario.id]
    );

    const { rows: ultima } = await pool.query(
      `SELECT n.id, n.fecha, u.nombre, u.apellido
       FROM notificaciones n
       LEFT JOIN estudiantes e ON e.id = n.estudiante_id
       LEFT JOIN usuarios u ON u.id = e.usuario_id
       WHERE n.usuario_id = $1 AND n.tipo = 'alerta_riesgo' AND COALESCE(n.leida, false) = false
       ORDER BY n.fecha DESC, n.id DESC
       LIMIT 1`,
      [req.usuario.id]
    );

    res.json({ ...rows[0], ultima_alerta: ultima[0] || null });
  } catch (error) {
    console.error('Error en contador de notificaciones:', error.message);
    res.status(500).json({ error: 'Error al consultar las notificaciones' });
  }
};

const marcarLeida = async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'UPDATE notificaciones SET leida = true WHERE id = $1 AND usuario_id = $2',
      [req.params.id, req.usuario.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    res.json({ mensaje: 'Marcada como leída' });
  } catch (error) {
    console.error('Error en marcarLeida:', error.message);
    res.status(500).json({ error: 'Error al actualizar la notificación' });
  }
};

const marcarTodas = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notificaciones SET leida = true
       WHERE usuario_id = $1 AND COALESCE(leida, false) = false
         AND COALESCE(tipo, 'info') <> 'alerta_riesgo'`,
      [req.usuario.id]
    );
    res.json({ mensaje: 'Todas marcadas como leídas' });
  } catch (error) {
    console.error('Error en marcarTodas:', error.message);
    res.status(500).json({ error: 'Error al actualizar las notificaciones' });
  }
};

module.exports = { listar, contador, marcarLeida, marcarTodas };

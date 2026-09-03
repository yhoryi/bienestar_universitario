const pool = require('../config/db');

// CREAR
const crearNotificacion = async ({ usuario_id, mensaje }) => {
  const query = `
    INSERT INTO notificaciones (usuario_id, mensaje)
    VALUES ($1, $2)
    RETURNING *`;
  const { rows } = await pool.query(query, [usuario_id, mensaje]);
  return rows[0];
};

// CONSULTAR (todas las de un usuario)
const obtenerNotificacionesPorUsuario = async (usuario_id) => {
  const { rows } = await pool.query(
    'SELECT * FROM notificaciones WHERE usuario_id = $1 ORDER BY fecha DESC',
    [usuario_id]
  );
  return rows;
};

// CONSULTAR (una por id)
const obtenerNotificacionPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM notificaciones WHERE id = $1', [id]);
  return rows[0];
};

// ACTUALIZAR (marcar como leída)
const marcarComoLeida = async (id) => {
  const { rows } = await pool.query(
    'UPDATE notificaciones SET leida = TRUE WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0];
};

// ELIMINAR
const eliminarNotificacion = async (id) => {
  const { rows } = await pool.query('DELETE FROM notificaciones WHERE id = $1 RETURNING *', [id]);
  return rows[0];
};

module.exports = {
  crearNotificacion,
  obtenerNotificacionesPorUsuario,
  obtenerNotificacionPorId,
  marcarComoLeida,
  eliminarNotificacion,
};

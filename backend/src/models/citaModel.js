const pool = require('../config/db');

// CREAR
const crearCita = async ({ estudiante_id, profesional_id, servicio_id, fecha, hora, motivo }) => {
  const query = `
    INSERT INTO citas (estudiante_id, profesional_id, servicio_id, fecha, hora, motivo)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`;
  const values = [estudiante_id, profesional_id, servicio_id, fecha, hora, motivo];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// CONSULTAR (todas las citas de un estudiante)
const obtenerCitasPorEstudiante = async (estudiante_id) => {
  const query = `
    SELECT c.*, s.nombre AS servicio, u.nombre AS profesional_nombre, u.apellido AS profesional_apellido
    FROM citas c
    JOIN servicios s ON s.id = c.servicio_id
    JOIN profesionales p ON p.id = c.profesional_id
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE c.estudiante_id = $1
    ORDER BY c.fecha DESC, c.hora DESC`;
  const { rows } = await pool.query(query, [estudiante_id]);
  return rows;
};

// CONSULTAR (todas las citas de un profesional)
const obtenerCitasPorProfesional = async (profesional_id) => {
  const { rows } = await pool.query(
    'SELECT * FROM citas WHERE profesional_id = $1 ORDER BY fecha DESC, hora DESC',
    [profesional_id]
  );
  return rows;
};

// CONSULTAR (una por id)
const obtenerCitaPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
  return rows[0];
};

// ACTUALIZAR (datos generales)
const actualizarCita = async (id, { fecha, hora, motivo }) => {
  const query = `
    UPDATE citas
    SET fecha = $1, hora = $2, motivo = $3
    WHERE id = $4
    RETURNING *`;
  const { rows } = await pool.query(query, [fecha, hora, motivo, id]);
  return rows[0];
};

// ACTUALIZAR (solo el estado: pendiente/confirmada/cancelada/realizada)
const actualizarEstadoCita = async (id, estado) => {
  const { rows } = await pool.query(
    'UPDATE citas SET estado = $1 WHERE id = $2 RETURNING *',
    [estado, id]
  );
  return rows[0];
};

// ELIMINAR
const eliminarCita = async (id) => {
  const { rows } = await pool.query('DELETE FROM citas WHERE id = $1 RETURNING *', [id]);
  return rows[0];
};

module.exports = {
  crearCita,
  obtenerCitasPorEstudiante,
  obtenerCitasPorProfesional,
  obtenerCitaPorId,
  actualizarCita,
  actualizarEstadoCita,
  eliminarCita,
};

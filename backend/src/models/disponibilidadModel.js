const pool = require('../config/db');

// CREAR
const crearDisponibilidad = async ({ profesional_id, dia_semana, hora_inicio, hora_fin }) => {
  const query = `
    INSERT INTO disponibilidad_profesionales (profesional_id, dia_semana, hora_inicio, hora_fin)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
  const values = [profesional_id, dia_semana, hora_inicio, hora_fin];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// CONSULTAR (toda la disponibilidad de un profesional)
const obtenerDisponibilidadPorProfesional = async (profesional_id) => {
  const { rows } = await pool.query(
    'SELECT * FROM disponibilidad_profesionales WHERE profesional_id = $1 ORDER BY dia_semana, hora_inicio',
    [profesional_id]
  );
  return rows;
};

// CONSULTAR (una por id)
const obtenerDisponibilidadPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM disponibilidad_profesionales WHERE id = $1', [id]);
  return rows[0];
};

// ACTUALIZAR
const actualizarDisponibilidad = async (id, { dia_semana, hora_inicio, hora_fin }) => {
  const query = `
    UPDATE disponibilidad_profesionales
    SET dia_semana = $1, hora_inicio = $2, hora_fin = $3
    WHERE id = $4
    RETURNING *`;
  const { rows } = await pool.query(query, [dia_semana, hora_inicio, hora_fin, id]);
  return rows[0];
};

// ELIMINAR
const eliminarDisponibilidad = async (id) => {
  const { rows } = await pool.query(
    'DELETE FROM disponibilidad_profesionales WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0];
};

module.exports = {
  crearDisponibilidad,
  obtenerDisponibilidadPorProfesional,
  obtenerDisponibilidadPorId,
  actualizarDisponibilidad,
  eliminarDisponibilidad,
};

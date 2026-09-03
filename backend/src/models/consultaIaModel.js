const pool = require('../config/db');

// CREAR
const crearConsulta = async ({ estudiante_id, mensaje, respuesta_ia, categoria_detectada, recomendacion }) => {
  const query = `
    INSERT INTO consultas_ia (estudiante_id, mensaje, respuesta_ia, categoria_detectada, recomendacion)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`;
  const values = [estudiante_id, mensaje, respuesta_ia, categoria_detectada, recomendacion];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// CONSULTAR (todas las de un estudiante, historial de conversación)
const obtenerConsultasPorEstudiante = async (estudiante_id) => {
  const { rows } = await pool.query(
    'SELECT * FROM consultas_ia WHERE estudiante_id = $1 ORDER BY fecha DESC',
    [estudiante_id]
  );
  return rows;
};

// CONSULTAR (una por id)
const obtenerConsultaPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM consultas_ia WHERE id = $1', [id]);
  return rows[0];
};

// ACTUALIZAR (por ejemplo, si se re-procesa la clasificación)
const actualizarConsulta = async (id, { categoria_detectada, recomendacion }) => {
  const query = `
    UPDATE consultas_ia
    SET categoria_detectada = $1, recomendacion = $2
    WHERE id = $3
    RETURNING *`;
  const { rows } = await pool.query(query, [categoria_detectada, recomendacion, id]);
  return rows[0];
};

// ELIMINAR
const eliminarConsulta = async (id) => {
  const { rows } = await pool.query('DELETE FROM consultas_ia WHERE id = $1 RETURNING *', [id]);
  return rows[0];
};

module.exports = {
  crearConsulta,
  obtenerConsultasPorEstudiante,
  obtenerConsultaPorId,
  actualizarConsulta,
  eliminarConsulta,
};

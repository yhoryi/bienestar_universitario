const pool = require('../config/db');

// CREAR (registro + factores asociados en una sola operación)
const crearRegistro = async ({ estudiante_id, estado_animo_id, nivel_estres, comentario, factores = [] }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO registros_bienestar (estudiante_id, estado_animo_id, nivel_estres, comentario)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
    const { rows } = await client.query(query, [estudiante_id, estado_animo_id, nivel_estres, comentario]);
    const registro = rows[0];

    for (const factor_id of factores) {
      await client.query(
        'INSERT INTO registro_factores (registro_id, factor_id) VALUES ($1, $2)',
        [registro.id, factor_id]
      );
    }

    await client.query('COMMIT');
    return registro;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// CONSULTAR (todos los registros de un estudiante, con estado de ánimo y factores)
const obtenerRegistrosPorEstudiante = async (estudiante_id) => {
  const query = `
    SELECT r.*, ea.nombre AS estado_animo, ea.emoji,
           COALESCE(json_agg(f.nombre) FILTER (WHERE f.nombre IS NOT NULL), '[]') AS factores
    FROM registros_bienestar r
    JOIN estados_animo ea ON ea.id = r.estado_animo_id
    LEFT JOIN registro_factores rf ON rf.registro_id = r.id
    LEFT JOIN factores_bienestar f ON f.id = rf.factor_id
    WHERE r.estudiante_id = $1
    GROUP BY r.id, ea.nombre, ea.emoji
    ORDER BY r.fecha_registro DESC`;
  const { rows } = await pool.query(query, [estudiante_id]);
  return rows;
};

// CONSULTAR (uno por id)
const obtenerRegistroPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM registros_bienestar WHERE id = $1', [id]);
  return rows[0];
};

// ACTUALIZAR
const actualizarRegistro = async (id, { estado_animo_id, nivel_estres, comentario }) => {
  const query = `
    UPDATE registros_bienestar
    SET estado_animo_id = $1, nivel_estres = $2, comentario = $3
    WHERE id = $4
    RETURNING *`;
  const { rows } = await pool.query(query, [estado_animo_id, nivel_estres, comentario, id]);
  return rows[0];
};

// ELIMINAR
const eliminarRegistro = async (id) => {
  const { rows } = await pool.query('DELETE FROM registros_bienestar WHERE id = $1 RETURNING *', [id]);
  return rows[0];
};

module.exports = {
  crearRegistro,
  obtenerRegistrosPorEstudiante,
  obtenerRegistroPorId,
  actualizarRegistro,
  eliminarRegistro,
};

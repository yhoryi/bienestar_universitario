const pool = require('../config/db');

// CREAR
const crearFactor = async ({ nombre }) => {
  const { rows } = await pool.query(
    'INSERT INTO factores_bienestar (nombre) VALUES ($1) RETURNING *',
    [nombre]
  );
  return rows[0];
};

// CONSULTAR (todos)
const obtenerFactores = async () => {
  const { rows } = await pool.query('SELECT * FROM factores_bienestar ORDER BY id');
  return rows;
};

// CONSULTAR (uno por id)
const obtenerFactorPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM factores_bienestar WHERE id = $1', [id]);
  return rows[0];
};

// ACTUALIZAR
const actualizarFactor = async (id, { nombre }) => {
  const { rows } = await pool.query(
    'UPDATE factores_bienestar SET nombre = $1 WHERE id = $2 RETURNING *',
    [nombre, id]
  );
  return rows[0];
};

// ELIMINAR
const eliminarFactor = async (id) => {
  const { rows } = await pool.query('DELETE FROM factores_bienestar WHERE id = $1 RETURNING *', [id]);
  return rows[0];
};

module.exports = {
  crearFactor,
  obtenerFactores,
  obtenerFactorPorId,
  actualizarFactor,
  eliminarFactor,
};

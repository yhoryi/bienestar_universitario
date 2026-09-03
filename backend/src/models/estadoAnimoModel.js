const pool = require('../config/db');

// CREAR
const crearEstadoAnimo = async ({ nombre, emoji, valor }) => {
  const query = `
    INSERT INTO estados_animo (nombre, emoji, valor)
    VALUES ($1, $2, $3)
    RETURNING *`;
  const { rows } = await pool.query(query, [nombre, emoji, valor]);
  return rows[0];
};

// CONSULTAR (todos)
const obtenerEstadosAnimo = async () => {
  const { rows } = await pool.query('SELECT * FROM estados_animo ORDER BY valor DESC');
  return rows;
};

// CONSULTAR (uno por id)
const obtenerEstadoAnimoPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM estados_animo WHERE id = $1', [id]);
  return rows[0];
};

// ACTUALIZAR
const actualizarEstadoAnimo = async (id, { nombre, emoji, valor }) => {
  const query = `
    UPDATE estados_animo
    SET nombre = $1, emoji = $2, valor = $3
    WHERE id = $4
    RETURNING *`;
  const { rows } = await pool.query(query, [nombre, emoji, valor, id]);
  return rows[0];
};

// ELIMINAR
const eliminarEstadoAnimo = async (id) => {
  const { rows } = await pool.query('DELETE FROM estados_animo WHERE id = $1 RETURNING *', [id]);
  return rows[0];
};

module.exports = {
  crearEstadoAnimo,
  obtenerEstadosAnimo,
  obtenerEstadoAnimoPorId,
  actualizarEstadoAnimo,
  eliminarEstadoAnimo,
};

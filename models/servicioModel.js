const pool = require('../config/db');

// CREAR
const crearServicio = async ({ nombre, descripcion }) => {
  const query = `
    INSERT INTO servicios (nombre, descripcion)
    VALUES ($1, $2)
    RETURNING *`;
  const { rows } = await pool.query(query, [nombre, descripcion]);
  return rows[0];
};

// CONSULTAR (todos)
const obtenerServicios = async () => {
  const { rows } = await pool.query('SELECT * FROM servicios ORDER BY id');
  return rows;
};

// CONSULTAR (uno por id)
const obtenerServicioPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM servicios WHERE id = $1', [id]);
  return rows[0];
};

// ACTUALIZAR
const actualizarServicio = async (id, { nombre, descripcion }) => {
  const query = `
    UPDATE servicios
    SET nombre = $1, descripcion = $2
    WHERE id = $3
    RETURNING *`;
  const { rows } = await pool.query(query, [nombre, descripcion, id]);
  return rows[0];
};

// ELIMINAR
const eliminarServicio = async (id) => {
  const { rows } = await pool.query('DELETE FROM servicios WHERE id = $1 RETURNING *', [id]);
  return rows[0];
};

module.exports = {
  crearServicio,
  obtenerServicios,
  obtenerServicioPorId,
  actualizarServicio,
  eliminarServicio,
};

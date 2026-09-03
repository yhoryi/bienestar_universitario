const pool = require('../config/db');

// CREAR
const crearUsuario = async ({ nombre, apellido, email, password, tipo_usuario }) => {
  const query = `
    INSERT INTO usuarios (nombre, apellido, email, password, tipo_usuario)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`;
  const values = [nombre, apellido, email, password, tipo_usuario];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// CONSULTAR (todos)
const obtenerUsuarios = async () => {
  const { rows } = await pool.query('SELECT * FROM usuarios ORDER BY id');
  return rows;
};

// CONSULTAR (uno por id)
const obtenerUsuarioPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  return rows[0];
};

// CONSULTAR (uno por email, útil para login)
const obtenerUsuarioPorEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
  return rows[0];
};

// ACTUALIZAR
const actualizarUsuario = async (id, { nombre, apellido, email, tipo_usuario, activo }) => {
  const query = `
    UPDATE usuarios
    SET nombre = $1, apellido = $2, email = $3, tipo_usuario = $4, activo = $5
    WHERE id = $6
    RETURNING *`;
  const values = [nombre, apellido, email, tipo_usuario, activo, id];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// ELIMINAR
const eliminarUsuario = async (id) => {
  const { rows } = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id]);
  return rows[0];
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerUsuarioPorEmail,
  actualizarUsuario,
  eliminarUsuario,
};

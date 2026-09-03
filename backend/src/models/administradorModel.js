const pool = require('../config/db');

// CREAR
const crearAdministrador = async ({ usuario_id, cargo }) => {
  const query = `
    INSERT INTO administradores (usuario_id, cargo)
    VALUES ($1, $2)
    RETURNING *`;
  const { rows } = await pool.query(query, [usuario_id, cargo]);
  return rows[0];
};

// CONSULTAR (todos)
const obtenerAdministradores = async () => {
  const query = `
    SELECT a.*, u.nombre, u.apellido, u.email
    FROM administradores a
    JOIN usuarios u ON u.id = a.usuario_id
    ORDER BY a.id`;
  const { rows } = await pool.query(query);
  return rows;
};

// CONSULTAR (uno por id)
const obtenerAdministradorPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM administradores WHERE id = $1', [id]);
  return rows[0];
};

// ACTUALIZAR
const actualizarAdministrador = async (id, { cargo }) => {
  const { rows } = await pool.query(
    'UPDATE administradores SET cargo = $1 WHERE id = $2 RETURNING *',
    [cargo, id]
  );
  return rows[0];
};

// ELIMINAR
const eliminarAdministrador = async (id) => {
  const { rows } = await pool.query('DELETE FROM administradores WHERE id = $1 RETURNING *', [id]);
  return rows[0];
};

module.exports = {
  crearAdministrador,
  obtenerAdministradores,
  obtenerAdministradorPorId,
  actualizarAdministrador,
  eliminarAdministrador,
};

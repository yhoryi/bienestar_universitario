const pool = require('../config/db');

// CREAR
const crearProfesional = async ({ usuario_id, servicio_id, numero_licencia, especialidad }) => {
  const query = `
    INSERT INTO profesionales (usuario_id, servicio_id, numero_licencia, especialidad)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
  const values = [usuario_id, servicio_id, numero_licencia, especialidad];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// CONSULTAR (todos, con datos del usuario y el servicio)
const obtenerProfesionales = async () => {
  const query = `
    SELECT p.*, u.nombre, u.apellido, u.email, s.nombre AS servicio
    FROM profesionales p
    JOIN usuarios u ON u.id = p.usuario_id
    JOIN servicios s ON s.id = p.servicio_id
    ORDER BY p.id`;
  const { rows } = await pool.query(query);
  return rows;
};

// CONSULTAR (uno por id)
const obtenerProfesionalPorId = async (id) => {
  const { rows } = await pool.query('SELECT * FROM profesionales WHERE id = $1', [id]);
  return rows[0];
};

// CONSULTAR (por servicio, ej. todos los psicólogos)
const obtenerProfesionalesPorServicio = async (servicio_id) => {
  const { rows } = await pool.query('SELECT * FROM profesionales WHERE servicio_id = $1', [servicio_id]);
  return rows;
};

// ACTUALIZAR
const actualizarProfesional = async (id, { servicio_id, numero_licencia, especialidad }) => {
  const query = `
    UPDATE profesionales
    SET servicio_id = $1, numero_licencia = $2, especialidad = $3
    WHERE id = $4
    RETURNING *`;
  const values = [servicio_id, numero_licencia, especialidad, id];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// ELIMINAR
const eliminarProfesional = async (id) => {
  const { rows } = await pool.query('DELETE FROM profesionales WHERE id = $1 RETURNING *', [id]);
  return rows[0];
};

module.exports = {
  crearProfesional,
  obtenerProfesionales,
  obtenerProfesionalPorId,
  obtenerProfesionalesPorServicio,
  actualizarProfesional,
  eliminarProfesional,
};

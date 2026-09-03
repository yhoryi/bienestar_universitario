const pool = require('../config/db');

// CREAR
const crearEstudiante = async ({ usuario_id, codigo_estudiantil, carrera, facultad, semestre }) => {
  const query = `
    INSERT INTO estudiantes (usuario_id, codigo_estudiantil, carrera, facultad, semestre)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`;
  const values = [usuario_id, codigo_estudiantil, carrera, facultad, semestre];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// CONSULTAR (todos, con datos del usuario)
const obtenerEstudiantes = async () => {
  const query = `
    SELECT e.*, u.nombre, u.apellido, u.email
    FROM estudiantes e
    JOIN usuarios u ON u.id = e.usuario_id
    ORDER BY e.id`;
  const { rows } = await pool.query(query);
  return rows;
};

// CONSULTAR (uno por id)
const obtenerEstudiantePorId = async (id) => {
  const query = `
    SELECT e.*, u.nombre, u.apellido, u.email
    FROM estudiantes e
    JOIN usuarios u ON u.id = e.usuario_id
    WHERE e.id = $1`;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

// CONSULTAR (por usuario_id, útil tras el login)
const obtenerEstudiantePorUsuarioId = async (usuario_id) => {
  const { rows } = await pool.query('SELECT * FROM estudiantes WHERE usuario_id = $1', [usuario_id]);
  return rows[0];
};

// ACTUALIZAR
const actualizarEstudiante = async (id, { codigo_estudiantil, carrera, facultad, semestre }) => {
  const query = `
    UPDATE estudiantes
    SET codigo_estudiantil = $1, carrera = $2, facultad = $3, semestre = $4
    WHERE id = $5
    RETURNING *`;
  const values = [codigo_estudiantil, carrera, facultad, semestre, id];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// ELIMINAR
const eliminarEstudiante = async (id) => {
  const { rows } = await pool.query('DELETE FROM estudiantes WHERE id = $1 RETURNING *', [id]);
  return rows[0];
};

module.exports = {
  crearEstudiante,
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  obtenerEstudiantePorUsuarioId,
  actualizarEstudiante,
  eliminarEstudiante,
};

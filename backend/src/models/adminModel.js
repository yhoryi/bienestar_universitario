// Va en: backend/src/models/adminModel.js
// CAPA DE MODELO del panel de administración: todo el SQL vive aquí.
// No conoce req/res: recibe datos y devuelve datos.
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
// Se reutilizan los modelos CRUD que ya existen para no duplicar consultas
const servicioModel = require('./servicioModel');
const citaModel = require('./citaModel');

// ---------- Notificaciones ----------
const notificar = (usuarioId, mensaje) =>
  pool
    .query('INSERT INTO notificaciones (usuario_id, mensaje) VALUES ($1, $2)', [usuarioId, mensaje])
    .catch((e) => console.error('No se pudo crear la notificación:', e.message));

// ---------- Resumen ----------
const resumen = async () => {
  const { rows } = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM estudiantes e JOIN usuarios u ON u.id = e.usuario_id WHERE u.activo = true)::int AS estudiantes,
      (SELECT COUNT(*) FROM profesionales p JOIN usuarios u ON u.id = p.usuario_id WHERE u.activo = true)::int AS profesionales,
      (SELECT COUNT(*) FROM servicios)::int AS servicios,
      (SELECT COUNT(*) FROM citas WHERE fecha = CURRENT_DATE AND estado IN ('pendiente','confirmada'))::int AS citas_hoy,
      (SELECT COUNT(*) FROM citas WHERE estado = 'pendiente')::int AS citas_pendientes,
      (SELECT COUNT(*) FROM registros_bienestar WHERE fecha_registro > NOW() - INTERVAL '7 days')::int AS checkins_semana,
      (SELECT COUNT(*) FROM consultas_ia WHERE fecha > NOW() - INTERVAL '7 days')::int AS mensajes_semana`
  );

  let alertas = 0;
  try {
    const a = await pool.query(
      `SELECT COUNT(DISTINCT estudiante_id)::int AS n FROM notificaciones
       WHERE tipo = 'alerta_riesgo' AND COALESCE(leida, false) = false`
    );
    alertas = a.rows[0].n;
  } catch {
    alertas = 0; // la columna aún no existe
  }
  return { ...rows[0], alertas_sin_atender: alertas };
};

// ---------- Estudiantes ----------
const listarEstudiantes = async (buscar) => {
  const { rows } = await pool.query(
    `SELECT e.id AS estudiante_id, u.id AS usuario_id, u.nombre, u.apellido, u.email, u.telefono,
            COALESCE(u.activo, true) AS activo,
            e.codigo_estudiantil, e.carrera, e.facultad, e.semestre
     FROM estudiantes e JOIN usuarios u ON u.id = e.usuario_id
     WHERE $1::text IS NULL OR u.nombre ILIKE $1 OR u.apellido ILIKE $1
        OR u.email ILIKE $1 OR e.codigo_estudiantil ILIKE $1 OR u.telefono ILIKE $1
     ORDER BY u.creado_en DESC, u.id DESC
     LIMIT 100`,
    [buscar ? `%${buscar}%` : null]
  );
  return rows;
};

const emailExiste = async (email) => {
  const { rowCount } = await pool.query('SELECT 1 FROM usuarios WHERE lower(email) = lower($1)', [email.trim()]);
  return rowCount > 0;
};

const servicioExiste = async (id) => {
  const { rowCount } = await pool.query('SELECT 1 FROM servicios WHERE id = $1', [id]);
  return rowCount > 0;
};

const insertarUsuario = async (client, { nombre, apellido, email, telefono, tipo, password }) => {
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await client.query(
    `INSERT INTO usuarios (nombre, apellido, email, telefono, password, tipo_usuario)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [nombre.trim(), apellido.trim(), email.trim(), telefono?.trim() || null, hash, tipo]
  );
  return rows[0].id;
};

// Usuario + perfil en una transacción: se guardan los dos o ninguno
const crearEstudiante = async (d) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const usuarioId = await insertarUsuario(client, { ...d, tipo: 'estudiante' });
    await client.query(
      `INSERT INTO estudiantes (usuario_id, codigo_estudiantil, carrera, facultad, semestre)
       VALUES ($1, $2, $3, $4, $5)`,
      [usuarioId, d.codigo_estudiantil.trim(), d.carrera?.trim() || null, d.facultad?.trim() || null, d.semestre]
    );
    await client.query('COMMIT');
    return usuarioId;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

// ---------- Profesionales ----------
const listarProfesionales = async () => {
  const { rows } = await pool.query(
    `SELECT p.id AS profesional_id, u.id AS usuario_id, u.nombre, u.apellido, u.email, u.telefono,
            COALESCE(u.activo, true) AS activo, p.numero_licencia, p.especialidad,
            s.nombre AS servicio,
            (SELECT COUNT(*) FROM disponibilidad_profesionales d WHERE d.profesional_id = p.id)::int AS franjas
     FROM profesionales p
     JOIN usuarios u ON u.id = p.usuario_id
     JOIN servicios s ON s.id = p.servicio_id
     ORDER BY u.nombre, u.apellido`
  );
  return rows;
};

const crearProfesional = async (d) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const usuarioId = await insertarUsuario(client, { ...d, tipo: 'profesional' });
    await client.query(
      `INSERT INTO profesionales (usuario_id, servicio_id, numero_licencia, especialidad)
       VALUES ($1, $2, $3, $4)`,
      [usuarioId, d.servicio_id, d.numero_licencia?.trim() || null, d.especialidad?.trim() || null]
    );
    await client.query('COMMIT');
    return usuarioId;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

// Solo estudiantes y profesionales (nunca administradores)
const cambiarActivo = async (usuarioId, activo) => {
  const { rowCount } = await pool.query(
    `UPDATE usuarios SET activo = $1
     WHERE id = $2 AND tipo_usuario IN ('estudiante', 'profesional')`,
    [activo, usuarioId]
  );
  return rowCount > 0;
};

// ---------- Servicios (CRUD completo) ----------
const listarServicios = async () => {
  const { rows } = await pool.query(
    `SELECT s.id, s.nombre, s.descripcion,
            (SELECT COUNT(*) FROM profesionales p WHERE p.servicio_id = s.id)::int AS profesionales,
            (SELECT COUNT(*) FROM citas c WHERE c.servicio_id = s.id)::int AS citas
     FROM servicios s ORDER BY s.nombre`
  );
  return rows;
};

// excluirId: al editar, el propio servicio no cuenta como duplicado
const nombreServicioExiste = async (nombre, excluirId = null) => {
  const { rowCount } = await pool.query(
    'SELECT 1 FROM servicios WHERE lower(nombre) = lower($1) AND ($2::int IS NULL OR id <> $2)',
    [nombre.trim(), excluirId]
  );
  return rowCount > 0;
};

// Crear / editar delegan en servicioModel (CRUD base)
const crearServicio = async (nombre, descripcion) => {
  const servicio = await servicioModel.crearServicio({
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || null,
  });
  return servicio.id;
};

const editarServicio = async (id, nombre, descripcion) => {
  const servicio = await servicioModel.actualizarServicio(id, {
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || null,
  });
  return Boolean(servicio);
};

// DELETE: solo borra un servicio que nadie usa.
// Devuelve { estado: 'eliminado' | 'no_existe' | 'en_uso', profesionales, citas }
const eliminarServicio = async (id) => {
  const { rows } = await pool.query(
    `SELECT (SELECT COUNT(*) FROM profesionales p WHERE p.servicio_id = s.id)::int AS profesionales,
            (SELECT COUNT(*) FROM citas c WHERE c.servicio_id = s.id)::int AS citas
     FROM servicios s WHERE s.id = $1`,
    [id]
  );
  const s = rows[0];
  if (!s) return { estado: 'no_existe' };
  if (s.profesionales > 0 || s.citas > 0) return { estado: 'en_uso', ...s };

  try {
    await servicioModel.eliminarServicio(id);
  } catch (error) {
    // 23503: alguien lo empezó a usar justo ahora; la llave foránea lo impide
    if (error.code === '23503') return { estado: 'en_uso', profesionales: 0, citas: 0 };
    throw error;
  }
  return { estado: 'eliminado' };
};

// ---------- Citas ----------
const buscarEstudianteActivo = async (id) => {
  const { rows } = await pool.query(
    `SELECT e.id, e.usuario_id FROM estudiantes e
     JOIN usuarios u ON u.id = e.usuario_id WHERE e.id = $1 AND u.activo = true`,
    [id]
  );
  return rows[0] || null;
};

const buscarProfesionalActivo = async (id) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.servicio_id, p.usuario_id FROM profesionales p
     JOIN usuarios u ON u.id = p.usuario_id WHERE p.id = $1 AND u.activo = true`,
    [id]
  );
  return rows[0] || null;
};

// Una cita agendada por el administrador queda confirmada (citaModel.crearCita acepta 'estado')
const crearCitaConfirmada = async ({ estudiante_id, profesional_id, servicio_id, fecha, hora, motivo }) => {
  const cita = await citaModel.crearCita({
    estudiante_id,
    profesional_id,
    servicio_id,
    fecha,
    hora,
    motivo: motivo?.trim() || null,
    estado: 'confirmada',
  });
  return cita.id;
};

const buscarCitaConPartes = async (id) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.estado, to_char(c.fecha, 'YYYY-MM-DD') AS fecha, to_char(c.hora, 'HH24:MI') AS hora,
            e.usuario_id AS estudiante_usuario, p.usuario_id AS profesional_usuario
     FROM citas c
     JOIN estudiantes e ON e.id = c.estudiante_id
     JOIN profesionales p ON p.id = c.profesional_id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const actualizarEstadoCita = (id, estado) => citaModel.actualizarEstadoCita(id, estado);

// DELETE: borra la cita (cualquier estado). Devuelve la cita borrada o undefined si no existía.
const eliminarCita = (id) => citaModel.eliminarCita(id);

module.exports = {
  notificar,
  resumen,
  listarEstudiantes,
  emailExiste,
  servicioExiste,
  crearEstudiante,
  listarProfesionales,
  crearProfesional,
  cambiarActivo,
  listarServicios,
  nombreServicioExiste,
  crearServicio,
  editarServicio,
  eliminarServicio,
  buscarEstudianteActivo,
  buscarProfesionalActivo,
  crearCitaConfirmada,
  buscarCitaConPartes,
  actualizarEstadoCita,
  eliminarCita,
};

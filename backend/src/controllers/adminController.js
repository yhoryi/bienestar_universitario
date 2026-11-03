const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const { horariosLibres, notificar } = require('./citasController');

const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hoyTexto = () => new Date().toLocaleDateString('en-CA');

const TRANSICIONES = {
  pendiente: ['confirmada', 'cancelada'],
  confirmada: ['realizada', 'cancelada'],
};

// Contraseña temporal sin caracteres confusos (sin 0, O, 1, l, I)
const generarPassword = () => {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => letras[crypto.randomInt(letras.length)]).join('');
};

const validarBasicos = ({ nombre, apellido, email, password }) => {
  if (!nombre?.trim() || !apellido?.trim() || !email?.trim()) {
    return 'Nombre, apellido y correo son obligatorios';
  }
  if (!EMAIL_VALIDO.test(email.trim())) return 'El correo no es válido';
  if (password && password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  return null;
};

const insertarUsuario = async (client, { nombre, apellido, email, tipo, password }) => {
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await client.query(
    `INSERT INTO usuarios (nombre, apellido, email, password, tipo_usuario)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [nombre.trim(), apellido.trim(), email.trim(), hash, tipo]
  );
  return rows[0].id;
};

// ---------- resumen y estadísticas ----------
const resumen = async (req, res) => {
  try {
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

    res.json({ ...rows[0], alertas_sin_atender: alertas });
  } catch (error) {
    console.error('Error en resumen:', error.message);
    res.status(500).json({ error: 'Error al cargar el resumen' });
  }
};

// Solo datos agregados: no se muestra ningún estudiante ni mensaje
const estadisticas = async (req, res) => {
  try {
    const [animo, estres, factores, categorias, porServicio, porEstado] = await Promise.all([
      pool.query(
        `SELECT ea.nombre, ea.emoji, ea.valor, COUNT(r.id)::int AS total
         FROM estados_animo ea
         LEFT JOIN registros_bienestar r
           ON r.estado_animo_id = ea.id AND r.fecha_registro > NOW() - INTERVAL '30 days'
         GROUP BY ea.id, ea.nombre, ea.emoji, ea.valor
         ORDER BY ea.valor`
      ),
      pool.query(
        `SELECT ROUND(AVG(nivel_estres)::numeric, 1) AS promedio, COUNT(*)::int AS registros
         FROM registros_bienestar WHERE fecha_registro > NOW() - INTERVAL '30 days'`
      ),
      pool.query(
        `SELECT f.nombre, COUNT(*)::int AS total
         FROM registro_factores rf
         JOIN factores_bienestar f ON f.id = rf.factor_id
         JOIN registros_bienestar r ON r.id = rf.registro_id
         WHERE r.fecha_registro > NOW() - INTERVAL '30 days'
         GROUP BY f.nombre ORDER BY total DESC LIMIT 6`
      ),
      pool.query(
        `SELECT COALESCE(categoria_detectada, 'otro') AS categoria, COUNT(*)::int AS total
         FROM consultas_ia WHERE fecha > NOW() - INTERVAL '30 days'
         GROUP BY 1 ORDER BY total DESC`
      ),
      pool.query(
        `SELECT s.nombre, COUNT(c.id)::int AS total
         FROM servicios s LEFT JOIN citas c ON c.servicio_id = s.id
         GROUP BY s.id, s.nombre ORDER BY total DESC, s.nombre`
      ),
      pool.query(`SELECT estado, COUNT(*)::int AS total FROM citas GROUP BY estado`),
    ]);

    res.json({
      animo: animo.rows,
      estres: estres.rows[0],
      factores: factores.rows,
      categorias: categorias.rows,
      citas_por_servicio: porServicio.rows,
      citas_por_estado: porEstado.rows,
    });
  } catch (error) {
    console.error('Error en estadisticas:', error.message);
    res.status(500).json({ error: 'Error al cargar las estadísticas' });
  }
};

// ---------- estudiantes ----------
const listarEstudiantes = async (req, res) => {
  const buscar = (req.query.buscar || '').trim();
  try {
    const { rows } = await pool.query(
      `SELECT e.id AS estudiante_id, u.id AS usuario_id, u.nombre, u.apellido, u.email,
              COALESCE(u.activo, true) AS activo,
              e.codigo_estudiantil, e.carrera, e.facultad, e.semestre
       FROM estudiantes e JOIN usuarios u ON u.id = e.usuario_id
       WHERE $1::text IS NULL OR u.nombre ILIKE $1 OR u.apellido ILIKE $1
          OR u.email ILIKE $1 OR e.codigo_estudiantil ILIKE $1
       ORDER BY u.creado_en DESC, u.id DESC
       LIMIT 100`,
      [buscar ? `%${buscar}%` : null]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en listarEstudiantes:', error.message);
    res.status(500).json({ error: 'Error al cargar los estudiantes' });
  }
};

const crearEstudiante = async (req, res) => {
  const { nombre, apellido, email, codigo_estudiantil, carrera, facultad, semestre } = req.body;
  const errorBasico = validarBasicos(req.body);
  if (errorBasico) return res.status(400).json({ error: errorBasico });
  if (!codigo_estudiantil?.trim()) {
    return res.status(400).json({ error: 'El código estudiantil es obligatorio' });
  }
  const sem = semestre ? Number(semestre) : null;
  if (sem !== null && (!Number.isInteger(sem) || sem < 1 || sem > 20)) {
    return res.status(400).json({ error: 'El semestre debe estar entre 1 y 20' });
  }

  const generada = !req.body.password;
  const password = req.body.password || generarPassword();

  const client = await pool.connect();
  try {
    const dup = await client.query('SELECT 1 FROM usuarios WHERE lower(email) = lower($1)', [email.trim()]);
    if (dup.rowCount > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }

    await client.query('BEGIN');
    const usuarioId = await insertarUsuario(client, { nombre, apellido, email, tipo: 'estudiante', password });
    await client.query(
      `INSERT INTO estudiantes (usuario_id, codigo_estudiantil, carrera, facultad, semestre)
       VALUES ($1, $2, $3, $4, $5)`,
      [usuarioId, codigo_estudiantil.trim(), carrera?.trim() || null, facultad?.trim() || null, sem]
    );
    await client.query('COMMIT');

    res.status(201).json({
      mensaje: 'Estudiante creado',
      email: email.trim(),
      password_temporal: generada ? password : null,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un estudiante con ese código o correo' });
    }
    console.error('Error en crearEstudiante:', error.message);
    res.status(500).json({ error: 'Error al crear el estudiante' });
  } finally {
    client.release();
  }
};

// ---------- profesionales ----------
const listarProfesionales = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id AS profesional_id, u.id AS usuario_id, u.nombre, u.apellido, u.email,
              COALESCE(u.activo, true) AS activo, p.numero_licencia, p.especialidad,
              s.nombre AS servicio,
              (SELECT COUNT(*) FROM disponibilidad_profesionales d WHERE d.profesional_id = p.id)::int AS franjas
       FROM profesionales p
       JOIN usuarios u ON u.id = p.usuario_id
       JOIN servicios s ON s.id = p.servicio_id
       ORDER BY u.nombre, u.apellido`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en listarProfesionales:', error.message);
    res.status(500).json({ error: 'Error al cargar los profesionales' });
  }
};

const crearProfesional = async (req, res) => {
  const { nombre, apellido, email, servicio_id, numero_licencia, especialidad } = req.body;
  const errorBasico = validarBasicos(req.body);
  if (errorBasico) return res.status(400).json({ error: errorBasico });
  if (!servicio_id) return res.status(400).json({ error: 'Elige el servicio del profesional' });

  const generada = !req.body.password;
  const password = req.body.password || generarPassword();

  const client = await pool.connect();
  try {
    const servicio = await client.query('SELECT 1 FROM servicios WHERE id = $1', [servicio_id]);
    if (servicio.rowCount === 0) {
      return res.status(400).json({ error: 'El servicio no existe' });
    }
    const dup = await client.query('SELECT 1 FROM usuarios WHERE lower(email) = lower($1)', [email.trim()]);
    if (dup.rowCount > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }

    await client.query('BEGIN');
    const usuarioId = await insertarUsuario(client, { nombre, apellido, email, tipo: 'profesional', password });
    await client.query(
      `INSERT INTO profesionales (usuario_id, servicio_id, numero_licencia, especialidad)
       VALUES ($1, $2, $3, $4)`,
      [usuarioId, servicio_id, numero_licencia?.trim() || null, especialidad?.trim() || null]
    );
    await client.query('COMMIT');

    res.status(201).json({
      mensaje: 'Profesional creado',
      email: email.trim(),
      password_temporal: generada ? password : null,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }
    console.error('Error en crearProfesional:', error.message);
    res.status(500).json({ error: 'Error al crear el profesional' });
  } finally {
    client.release();
  }
};

// Activar o desactivar una cuenta (sirve para estudiantes y profesionales)
const cambiarActivo = async (req, res) => {
  const { activo } = req.body;
  if (typeof activo !== 'boolean') {
    return res.status(400).json({ error: 'Indica si la cuenta debe estar activa' });
  }
  if (Number(req.params.id) === req.usuario.id) {
    return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
  }

  try {
    const { rowCount } = await pool.query(
      `UPDATE usuarios SET activo = $1
       WHERE id = $2 AND tipo_usuario IN ('estudiante', 'profesional')`,
      [activo, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: activo ? 'Cuenta activada' : 'Cuenta desactivada' });
  } catch (error) {
    console.error('Error en cambiarActivo:', error.message);
    res.status(500).json({ error: 'Error al actualizar la cuenta' });
  }
};

// ---------- servicios ----------
const listarServicios = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.nombre, s.descripcion,
              (SELECT COUNT(*) FROM profesionales p WHERE p.servicio_id = s.id)::int AS profesionales,
              (SELECT COUNT(*) FROM citas c WHERE c.servicio_id = s.id)::int AS citas
       FROM servicios s ORDER BY s.nombre`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en listarServicios:', error.message);
    res.status(500).json({ error: 'Error al cargar los servicios' });
  }
};

const crearServicio = async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre del servicio es obligatorio' });

  try {
    const dup = await pool.query('SELECT 1 FROM servicios WHERE lower(nombre) = lower($1)', [nombre.trim()]);
    if (dup.rowCount > 0) return res.status(409).json({ error: 'Ya existe un servicio con ese nombre' });

    const { rows } = await pool.query(
      'INSERT INTO servicios (nombre, descripcion) VALUES ($1, $2) RETURNING id',
      [nombre.trim(), descripcion?.trim() || null]
    );
    res.status(201).json({ id: rows[0].id, mensaje: 'Servicio creado' });
  } catch (error) {
    console.error('Error en crearServicio:', error.message);
    res.status(500).json({ error: 'Error al crear el servicio' });
  }
};

const editarServicio = async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre del servicio es obligatorio' });

  try {
    const dup = await pool.query(
      'SELECT 1 FROM servicios WHERE lower(nombre) = lower($1) AND id <> $2',
      [nombre.trim(), req.params.id]
    );
    if (dup.rowCount > 0) return res.status(409).json({ error: 'Ya existe un servicio con ese nombre' });

    const { rowCount } = await pool.query(
      'UPDATE servicios SET nombre = $1, descripcion = $2 WHERE id = $3',
      [nombre.trim(), descripcion?.trim() || null, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json({ mensaje: 'Servicio actualizado' });
  } catch (error) {
    console.error('Error en editarServicio:', error.message);
    res.status(500).json({ error: 'Error al actualizar el servicio' });
  }
};

// ---------- citas ----------
// El admin programa una cita entre un estudiante y un profesional (queda confirmada)
const crearCita = async (req, res) => {
  const { estudiante_id, profesional_id, fecha, hora, motivo } = req.body;

  if (!estudiante_id || !profesional_id || !fecha || !hora) {
    return res.status(400).json({ error: 'Estudiante, profesional, fecha y hora son obligatorios' });
  }
  if (!FECHA_VALIDA.test(fecha) || isNaN(new Date(`${fecha}T12:00:00`))) {
    return res.status(400).json({ error: 'La fecha no es válida' });
  }
  if (fecha < hoyTexto()) {
    return res.status(400).json({ error: 'No puedes programar una cita en una fecha pasada' });
  }

  try {
    const est = await pool.query(
      `SELECT e.id, e.usuario_id FROM estudiantes e
       JOIN usuarios u ON u.id = e.usuario_id WHERE e.id = $1 AND u.activo = true`,
      [estudiante_id]
    );
    const prof = await pool.query(
      `SELECT p.id, p.servicio_id, p.usuario_id FROM profesionales p
       JOIN usuarios u ON u.id = p.usuario_id WHERE p.id = $1 AND u.activo = true`,
      [profesional_id]
    );
    if (!est.rows[0]) return res.status(404).json({ error: 'Estudiante no encontrado o inactivo' });
    if (!prof.rows[0]) return res.status(404).json({ error: 'Profesional no encontrado o inactivo' });

    const libres = await horariosLibres(prof.rows[0].id, fecha);
    if (!libres.includes(hora)) {
      return res.status(409).json({ error: 'Ese horario no está disponible' });
    }

    const { rows } = await pool.query(
      `INSERT INTO citas (estudiante_id, profesional_id, servicio_id, fecha, hora, estado, motivo)
       VALUES ($1, $2, $3, $4, $5, 'confirmada', $6) RETURNING id`,
      [est.rows[0].id, prof.rows[0].id, prof.rows[0].servicio_id, fecha, hora, motivo?.trim() || null]
    );

    await notificar(est.rows[0].usuario_id, `Se programó una cita para ti el ${fecha} a las ${hora}.`);
    await notificar(prof.rows[0].usuario_id, `Se programó una cita con un estudiante el ${fecha} a las ${hora}.`);

    res.status(201).json({ id: rows[0].id, mensaje: 'Cita programada' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ese horario ya fue tomado, elige otro' });
    }
    console.error('Error en crearCita (admin):', error.message);
    res.status(500).json({ error: 'Error al programar la cita' });
  }
};

const cambiarEstadoCita = async (req, res) => {
  const { estado } = req.body;

  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.estado, to_char(c.fecha, 'YYYY-MM-DD') AS fecha, to_char(c.hora, 'HH24:MI') AS hora,
              e.usuario_id AS estudiante_usuario, p.usuario_id AS profesional_usuario
       FROM citas c
       JOIN estudiantes e ON e.id = c.estudiante_id
       JOIN profesionales p ON p.id = c.profesional_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    const cita = rows[0];
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

    if (!(TRANSICIONES[cita.estado] || []).includes(estado)) {
      return res.status(400).json({ error: `No se puede pasar una cita de "${cita.estado}" a "${estado}"` });
    }

    await pool.query('UPDATE citas SET estado = $1 WHERE id = $2', [estado, cita.id]);

    const texto = {
      confirmada: `La cita del ${cita.fecha} a las ${cita.hora} fue confirmada por Bienestar.`,
      cancelada: `La cita del ${cita.fecha} a las ${cita.hora} fue cancelada por Bienestar.`,
      realizada: `La cita del ${cita.fecha} fue marcada como realizada.`,
    }[estado];

    await notificar(cita.estudiante_usuario, texto);
    await notificar(cita.profesional_usuario, texto);

    res.json({ mensaje: 'Estado actualizado' });
  } catch (error) {
    console.error('Error en cambiarEstadoCita (admin):', error.message);
    res.status(500).json({ error: 'Error al actualizar la cita' });
  }
};

module.exports = {
  resumen,
  estadisticas,
  listarEstudiantes,
  crearEstudiante,
  listarProfesionales,
  crearProfesional,
  cambiarActivo,
  listarServicios,
  crearServicio,
  editarServicio,
  crearCita,
  cambiarEstadoCita,
};
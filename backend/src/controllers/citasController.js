const pool = require('../config/db');

const DURACION_MIN = 60; // duración de cada cita en minutos
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

// Estados permitidos por la tabla: pendiente, confirmada, cancelada, realizada
const TRANSICIONES = {
  pendiente: ['confirmada', 'cancelada'],
  confirmada: ['realizada', 'cancelada'],
};

// ---------- utilidades ----------
const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const aTexto = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const hoyTexto = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

const idEstudiante = async (usuarioId) => {
  const { rows } = await pool.query('SELECT id FROM estudiantes WHERE usuario_id = $1', [usuarioId]);
  return rows[0]?.id;
};
const idProfesional = async (usuarioId) => {
  const { rows } = await pool.query('SELECT id FROM profesionales WHERE usuario_id = $1', [usuarioId]);
  return rows[0]?.id;
};

const notificar = (usuarioId, mensaje) =>
  pool
    .query('INSERT INTO notificaciones (usuario_id, mensaje) VALUES ($1, $2)', [usuarioId, mensaje])
    .catch((e) => console.error('No se pudo crear la notificación:', e.message));

// Horas libres de un profesional en una fecha (bloques de DURACION_MIN)
const horariosLibres = async (profesionalId, fecha) => {
  const dia = DIAS[new Date(`${fecha}T12:00:00`).getDay()];

  const { rows: bloques } = await pool.query(
    `SELECT to_char(hora_inicio, 'HH24:MI') AS inicio, to_char(hora_fin, 'HH24:MI') AS fin
     FROM disponibilidad_profesionales
     WHERE profesional_id = $1 AND dia_semana = $2`,
    [profesionalId, dia]
  );

  const { rows: ocupadas } = await pool.query(
    `SELECT to_char(hora, 'HH24:MI') AS hora FROM citas
     WHERE profesional_id = $1 AND fecha = $2 AND estado IN ('pendiente', 'confirmada')`,
    [profesionalId, fecha]
  );
  const ocupadasSet = new Set(ocupadas.map((o) => o.hora));

  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const esHoy = fecha === hoyTexto();

  const libres = new Set();
  for (const b of bloques) {
    for (let t = aMinutos(b.inicio); t + DURACION_MIN <= aMinutos(b.fin); t += DURACION_MIN) {
      const texto = aTexto(t);
      if (ocupadasSet.has(texto)) continue;
      if (esHoy && t <= minutosAhora) continue;
      libres.add(texto);
    }
  }
  return [...libres].sort();
};

const SELECT_CITA = `
  c.id, to_char(c.fecha, 'YYYY-MM-DD') AS fecha, to_char(c.hora, 'HH24:MI') AS hora,
  c.estado, c.motivo, c.creado_en, s.nombre AS servicio`;

// ---------- catálogos (cualquier usuario con sesión) ----------
const listarServicios = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre, descripcion FROM servicios ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    console.error('Error en listarServicios:', error.message);
    res.status(500).json({ error: 'Error al obtener los servicios' });
  }
};

const listarProfesionales = async (req, res) => {
  const { servicio_id } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT p.id, u.nombre, u.apellido, p.especialidad, p.servicio_id
       FROM profesionales p
       JOIN usuarios u ON u.id = p.usuario_id
       WHERE u.activo = true AND ($1::int IS NULL OR p.servicio_id = $1::int)
       ORDER BY u.nombre`,
      [servicio_id || null]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en listarProfesionales:', error.message);
    res.status(500).json({ error: 'Error al obtener los profesionales' });
  }
};

const obtenerHorarios = async (req, res) => {
  const { profesional_id, fecha } = req.query;

  if (!profesional_id || !fecha || !FECHA_VALIDA.test(fecha) || isNaN(new Date(`${fecha}T12:00:00`))) {
    return res.status(400).json({ error: 'Profesional y fecha válida son obligatorios' });
  }
  if (fecha < hoyTexto()) {
    return res.json([]);
  }

  try {
    res.json(await horariosLibres(profesional_id, fecha));
  } catch (error) {
    console.error('Error en obtenerHorarios:', error.message);
    res.status(500).json({ error: 'Error al obtener los horarios' });
  }
};

// ---------- estudiante ----------
const crearCita = async (req, res) => {
  const { profesional_id, fecha, hora, motivo } = req.body;

  if (!profesional_id || !fecha || !hora) {
    return res.status(400).json({ error: 'Profesional, fecha y hora son obligatorios' });
  }
  if (!FECHA_VALIDA.test(fecha) || isNaN(new Date(`${fecha}T12:00:00`))) {
    return res.status(400).json({ error: 'La fecha no es válida' });
  }
  if (fecha < hoyTexto()) {
    return res.status(400).json({ error: 'No puedes agendar en una fecha pasada' });
  }

  try {
    const estudianteId = await idEstudiante(req.usuario.id);
    if (!estudianteId) {
      return res.status(403).json({ error: 'Tu cuenta no tiene perfil de estudiante' });
    }

    const { rows } = await pool.query(
      `SELECT p.id, p.servicio_id, p.usuario_id
       FROM profesionales p JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.id = $1 AND u.activo = true`,
      [profesional_id]
    );
    const profesional = rows[0];
    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const libres = await horariosLibres(profesional.id, fecha);
    if (!libres.includes(hora)) {
      return res.status(409).json({ error: 'Ese horario ya no está disponible' });
    }

    const { rows: creada } = await pool.query(
      `INSERT INTO citas (estudiante_id, profesional_id, servicio_id, fecha, hora, motivo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [estudianteId, profesional.id, profesional.servicio_id, fecha, hora, motivo || null]
    );

    await notificar(profesional.usuario_id, `Nueva solicitud de cita para el ${fecha} a las ${hora}.`);

    res.status(201).json({ id: creada[0].id, mensaje: 'Cita solicitada correctamente' });
  } catch (error) {
    // El índice único evita la doble reserva incluso si dos personas piden a la vez
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ese horario ya fue tomado, elige otro' });
    }
    console.error('Error en crearCita:', error.message);
    res.status(500).json({ error: 'Error al solicitar la cita' });
  }
};

const misCitas = async (req, res) => {
  try {
    const estudianteId = await idEstudiante(req.usuario.id);
    if (!estudianteId) return res.json([]);

    const { rows } = await pool.query(
      `SELECT ${SELECT_CITA}, u.nombre AS profesional_nombre, u.apellido AS profesional_apellido
       FROM citas c
       JOIN servicios s ON s.id = c.servicio_id
       JOIN profesionales p ON p.id = c.profesional_id
       JOIN usuarios u ON u.id = p.usuario_id
       WHERE c.estudiante_id = $1
       ORDER BY c.fecha DESC, c.hora DESC`,
      [estudianteId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en misCitas:', error.message);
    res.status(500).json({ error: 'Error al obtener tus citas' });
  }
};

const cancelarCita = async (req, res) => {
  try {
    const estudianteId = await idEstudiante(req.usuario.id);

    const { rows } = await pool.query(
      `UPDATE citas SET estado = 'cancelada'
       WHERE id = $1 AND estudiante_id = $2 AND estado IN ('pendiente', 'confirmada')
       RETURNING profesional_id, to_char(fecha, 'YYYY-MM-DD') AS fecha, to_char(hora, 'HH24:MI') AS hora`,
      [req.params.id, estudianteId]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'No se encontró una cita activa para cancelar' });
    }

    const { rows: prof } = await pool.query('SELECT usuario_id FROM profesionales WHERE id = $1', [
      rows[0].profesional_id,
    ]);
    if (prof[0]) {
      await notificar(
        prof[0].usuario_id,
        `Un estudiante canceló la cita del ${rows[0].fecha} a las ${rows[0].hora}.`
      );
    }

    res.json({ mensaje: 'Cita cancelada' });
  } catch (error) {
    console.error('Error en cancelarCita:', error.message);
    res.status(500).json({ error: 'Error al cancelar la cita' });
  }
};

// ---------- profesional ----------
const citasProfesional = async (req, res) => {
  try {
    const profesionalId = await idProfesional(req.usuario.id);
    if (!profesionalId) return res.json([]);

    const { rows } = await pool.query(
      `SELECT ${SELECT_CITA}, u.nombre AS estudiante_nombre, u.apellido AS estudiante_apellido,
              e.codigo_estudiantil AS estudiante_codigo, e.carrera AS estudiante_carrera
       FROM citas c
       JOIN servicios s ON s.id = c.servicio_id
       JOIN estudiantes e ON e.id = c.estudiante_id
       JOIN usuarios u ON u.id = e.usuario_id
       WHERE c.profesional_id = $1
       ORDER BY c.fecha DESC, c.hora DESC`,
      [profesionalId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en citasProfesional:', error.message);
    res.status(500).json({ error: 'Error al obtener las citas' });
  }
};

const cambiarEstado = async (req, res) => {
  const { estado } = req.body;

  try {
    const profesionalId = await idProfesional(req.usuario.id);

    const { rows } = await pool.query(
      `SELECT c.id, c.estado, to_char(c.fecha, 'YYYY-MM-DD') AS fecha, to_char(c.hora, 'HH24:MI') AS hora,
              e.usuario_id AS estudiante_usuario_id
       FROM citas c JOIN estudiantes e ON e.id = c.estudiante_id
       WHERE c.id = $1 AND c.profesional_id = $2`,
      [req.params.id, profesionalId]
    );
    const cita = rows[0];
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (!(TRANSICIONES[cita.estado] || []).includes(estado)) {
      return res.status(400).json({
        error: `No se puede pasar una cita de "${cita.estado}" a "${estado}"`,
      });
    }

    await pool.query('UPDATE citas SET estado = $1 WHERE id = $2', [estado, cita.id]);

    const textos = {
      confirmada: `Tu cita del ${cita.fecha} a las ${cita.hora} fue confirmada.`,
      cancelada: `Tu cita del ${cita.fecha} a las ${cita.hora} fue cancelada por el profesional.`,
      realizada: `Tu cita del ${cita.fecha} fue marcada como realizada.`,
    };
    await notificar(cita.estudiante_usuario_id, textos[estado]);

    res.json({ mensaje: 'Estado actualizado' });
  } catch (error) {
    console.error('Error en cambiarEstado:', error.message);
    res.status(500).json({ error: 'Error al actualizar la cita' });
  }
};

// ---------- admin ----------
const todasLasCitas = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${SELECT_CITA},
              ue.nombre AS estudiante_nombre, ue.apellido AS estudiante_apellido,
              up.nombre AS profesional_nombre, up.apellido AS profesional_apellido
       FROM citas c
       JOIN servicios s ON s.id = c.servicio_id
       JOIN estudiantes e ON e.id = c.estudiante_id
       JOIN usuarios ue ON ue.id = e.usuario_id
       JOIN profesionales p ON p.id = c.profesional_id
       JOIN usuarios up ON up.id = p.usuario_id
       ORDER BY c.fecha DESC, c.hora DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en todasLasCitas:', error.message);
    res.status(500).json({ error: 'Error al obtener las citas' });
  }
};

module.exports = {
  listarServicios,
  listarProfesionales,
  obtenerHorarios,
  crearCita,
  misCitas,
  cancelarCita,
  citasProfesional,
  cambiarEstado,
  todasLasCitas,
};

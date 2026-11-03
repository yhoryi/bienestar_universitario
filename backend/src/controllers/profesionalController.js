const pool = require('../config/db');

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const DURACION_CITA_MIN = 60; // una franja debe caber al menos una cita

const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const idProfesional = async (usuarioId) => {
  const { rows } = await pool.query('SELECT id FROM profesionales WHERE usuario_id = $1', [usuarioId]);
  return rows[0]?.id;
};

// ---------- perfil ----------
const perfil = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.nombre, u.apellido, u.email, p.numero_licencia, p.especialidad,
              s.nombre AS servicio
       FROM profesionales p
       JOIN usuarios u ON u.id = p.usuario_id
       JOIN servicios s ON s.id = p.servicio_id
       WHERE p.usuario_id = $1`,
      [req.usuario.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Tu cuenta no tiene perfil de profesional' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error en perfil:', error.message);
    res.status(500).json({ error: 'Error al cargar tu perfil' });
  }
};

// ---------- disponibilidad ----------
const listarDisponibilidad = async (req, res) => {
  try {
    const profesionalId = await idProfesional(req.usuario.id);
    if (!profesionalId) return res.json([]);

    const { rows } = await pool.query(
      `SELECT id, dia_semana,
              to_char(hora_inicio, 'HH24:MI') AS hora_inicio,
              to_char(hora_fin, 'HH24:MI') AS hora_fin
       FROM disponibilidad_profesionales
       WHERE profesional_id = $1
       ORDER BY array_position($2::text[], dia_semana::text), hora_inicio`,
      [profesionalId, DIAS]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en listarDisponibilidad:', error.message);
    res.status(500).json({ error: 'Error al cargar tu disponibilidad' });
  }
};

const crearDisponibilidad = async (req, res) => {
  const { dia_semana, hora_inicio, hora_fin } = req.body;

  if (!DIAS.includes(dia_semana)) {
    return res.status(400).json({ error: 'Elige un día válido' });
  }
  if (!HORA.test(hora_inicio || '') || !HORA.test(hora_fin || '')) {
    return res.status(400).json({ error: 'Las horas deben tener el formato HH:MM' });
  }
  if (aMinutos(hora_fin) <= aMinutos(hora_inicio)) {
    return res.status(400).json({ error: 'La hora de fin debe ser posterior a la de inicio' });
  }
  if (aMinutos(hora_fin) - aMinutos(hora_inicio) < DURACION_CITA_MIN) {
    return res.status(400).json({
      error: `La franja debe durar al menos ${DURACION_CITA_MIN} minutos para que quepa una cita`,
    });
  }

  try {
    const profesionalId = await idProfesional(req.usuario.id);
    if (!profesionalId) {
      return res.status(403).json({ error: 'Tu cuenta no tiene perfil de profesional' });
    }

    // No permitir franjas que se crucen con otra del mismo día
    const cruce = await pool.query(
      `SELECT 1 FROM disponibilidad_profesionales
       WHERE profesional_id = $1 AND dia_semana = $2
         AND hora_inicio < $4::time AND hora_fin > $3::time
       LIMIT 1`,
      [profesionalId, dia_semana, hora_inicio, hora_fin]
    );
    if (cruce.rowCount > 0) {
      return res.status(409).json({ error: 'Esa franja se cruza con otra que ya tienes ese día' });
    }

    const { rows } = await pool.query(
      `INSERT INTO disponibilidad_profesionales (profesional_id, dia_semana, hora_inicio, hora_fin)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [profesionalId, dia_semana, hora_inicio, hora_fin]
    );
    res.status(201).json({ id: rows[0].id, mensaje: 'Franja agregada' });
  } catch (error) {
    console.error('Error en crearDisponibilidad:', error.message);
    res.status(500).json({ error: 'Error al guardar la franja' });
  }
};

const eliminarDisponibilidad = async (req, res) => {
  try {
    const profesionalId = await idProfesional(req.usuario.id);

    const { rowCount } = await pool.query(
      'DELETE FROM disponibilidad_profesionales WHERE id = $1 AND profesional_id = $2',
      [req.params.id, profesionalId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'No se encontró esa franja' });
    }
    res.json({ mensaje: 'Franja eliminada' });
  } catch (error) {
    console.error('Error en eliminarDisponibilidad:', error.message);
    res.status(500).json({ error: 'Error al eliminar la franja' });
  }
};

module.exports = { perfil, listarDisponibilidad, crearDisponibilidad, eliminarDisponibilidad };

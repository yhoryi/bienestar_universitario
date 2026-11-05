// Va en: backend/src/controllers/adminController.js  (reemplaza el actual)
// CAPA DE CONTROLADOR: valida la petición, llama al modelo y arma la respuesta HTTP.
// Ya no contiene SQL: está en models/adminModel.js e informeModel.js.
const crypto = require('crypto');
const admin = require('../models/adminModel');
const informe = require('../models/informeModel');
const { horariosLibres } = require('./citasController');

const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hoyTexto = () => new Date().toLocaleDateString('en-CA');
const MAX_DIAS_INFORME = 366;

const TRANSICIONES = {
  pendiente: ['confirmada', 'cancelada'],
  confirmada: ['realizada', 'cancelada'],
};

// Contraseña temporal sin caracteres confusos (sin 0, O, 1, l, I)
const generarPassword = () => {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => letras[crypto.randomInt(letras.length)]).join('');
};

const TELEFONO_VALIDO = /^\+?[\d\s-]{7,20}$/;

const validarBasicos = ({ nombre, apellido, email, password, telefono }) => {
  if (!nombre?.trim() || !apellido?.trim() || !email?.trim()) {
    return 'Nombre, apellido y correo son obligatorios';
  }
  if (!EMAIL_VALIDO.test(email.trim())) return 'El correo no es válido';
  if (password && password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (telefono?.trim() && !TELEFONO_VALIDO.test(telefono.trim())) {
    return 'El teléfono solo puede tener números, espacios, guiones y un + inicial (7 a 20 caracteres)';
  }
  return null;
};

const fechaReal = (f) => FECHA_VALIDA.test(f) && !isNaN(new Date(`${f}T12:00:00`));

const fallo = (res, etiqueta, mensaje) => (error) => {
  console.error(`Error en ${etiqueta}:`, error.message);
  res.status(500).json({ error: mensaje });
};

// ---------- Resumen ----------
const resumen = (req, res) =>
  admin.resumen().then((r) => res.json(r)).catch(fallo(res, 'resumen', 'Error al cargar el resumen'));

// ---------- Informes (antes "estadísticas") ----------
// GET /api/admin/informes?desde=AAAA-MM-DD&hasta=AAAA-MM-DD   (por defecto: últimos 30 días)
const informes = async (req, res) => {
  const hasta = req.query.hasta || hoyTexto();
  const desde =
    req.query.desde ||
    new Date(new Date(`${hasta}T12:00:00`).getTime() - 29 * 86400000).toLocaleDateString('en-CA');

  if (!fechaReal(desde) || !fechaReal(hasta)) {
    return res.status(400).json({ error: 'Las fechas deben tener el formato AAAA-MM-DD' });
  }
  if (desde > hasta) {
    return res.status(400).json({ error: 'La fecha inicial no puede ser posterior a la final' });
  }
  const dias = Math.round((new Date(`${hasta}T12:00:00`) - new Date(`${desde}T12:00:00`)) / 86400000) + 1;
  if (dias > MAX_DIAS_INFORME) {
    return res.status(400).json({ error: `El rango máximo es de ${MAX_DIAS_INFORME} días` });
  }

  try {
    const [general, profesionales] = await Promise.all([
      informe.general(desde, hasta),
      informe.porProfesional(desde, hasta),
    ]);
    res.json({
      rango: { desde, hasta, dias },
      ...general,
      // nombres antiguos, por si alguna pantalla todavía los usa
      citas_por_servicio: general.citas_servicio,
      citas_por_estado: general.citas_estado,
      profesionales,
    });
  } catch (error) {
    fallo(res, 'informes', 'Error al generar el informe')(error);
  }
};

// ---------- Estudiantes ----------
const listarEstudiantes = (req, res) =>
  admin
    .listarEstudiantes((req.query.buscar || '').trim())
    .then((r) => res.json(r))
    .catch(fallo(res, 'listarEstudiantes', 'Error al cargar los estudiantes'));

const crearEstudiante = async (req, res) => {
  const { nombre, apellido, email, telefono, codigo_estudiantil, carrera, facultad, semestre } = req.body;
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

  try {
    if (await admin.emailExiste(email)) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }
    await admin.crearEstudiante({ nombre, apellido, email, telefono, password, codigo_estudiantil, carrera, facultad, semestre: sem });
    res.status(201).json({
      mensaje: 'Estudiante creado',
      email: email.trim(),
      password_temporal: generada ? password : null,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un estudiante con ese código o correo' });
    }
    fallo(res, 'crearEstudiante', 'Error al crear el estudiante')(error);
  }
};

// ---------- Profesionales ----------
const listarProfesionales = (req, res) =>
  admin.listarProfesionales().then((r) => res.json(r)).catch(fallo(res, 'listarProfesionales', 'Error al cargar los profesionales'));

const crearProfesional = async (req, res) => {
  const { nombre, apellido, email, telefono, servicio_id, numero_licencia, especialidad } = req.body;
  const errorBasico = validarBasicos(req.body);
  if (errorBasico) return res.status(400).json({ error: errorBasico });
  if (!servicio_id) return res.status(400).json({ error: 'Elige el servicio del profesional' });

  const generada = !req.body.password;
  const password = req.body.password || generarPassword();

  try {
    if (!(await admin.servicioExiste(servicio_id))) {
      return res.status(400).json({ error: 'El servicio no existe' });
    }
    if (await admin.emailExiste(email)) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }
    await admin.crearProfesional({ nombre, apellido, email, telefono, password, servicio_id, numero_licencia, especialidad });
    res.status(201).json({
      mensaje: 'Profesional creado',
      email: email.trim(),
      password_temporal: generada ? password : null,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }
    fallo(res, 'crearProfesional', 'Error al crear el profesional')(error);
  }
};

// Activar o desactivar una cuenta (estudiantes y profesionales)
const cambiarActivo = async (req, res) => {
  const { activo } = req.body;
  if (typeof activo !== 'boolean') {
    return res.status(400).json({ error: 'Indica si la cuenta debe estar activa' });
  }
  if (Number(req.params.id) === req.usuario.id) {
    return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
  }
  try {
    if (!(await admin.cambiarActivo(req.params.id, activo))) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: activo ? 'Cuenta activada' : 'Cuenta desactivada' });
  } catch (error) {
    fallo(res, 'cambiarActivo', 'Error al actualizar la cuenta')(error);
  }
};

// ---------- Servicios ----------
const listarServicios = (req, res) =>
  admin.listarServicios().then((r) => res.json(r)).catch(fallo(res, 'listarServicios', 'Error al cargar los servicios'));

const crearServicio = async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre del servicio es obligatorio' });

  try {
    if (await admin.nombreServicioExiste(nombre)) {
      return res.status(409).json({ error: 'Ya existe un servicio con ese nombre' });
    }
    const id = await admin.crearServicio(nombre, descripcion);
    res.status(201).json({ id, mensaje: 'Servicio creado' });
  } catch (error) {
    fallo(res, 'crearServicio', 'Error al crear el servicio')(error);
  }
};

const editarServicio = async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre del servicio es obligatorio' });

  try {
    if (await admin.nombreServicioExiste(nombre, Number(req.params.id))) {
      return res.status(409).json({ error: 'Ya existe un servicio con ese nombre' });
    }
    if (!(await admin.editarServicio(req.params.id, nombre, descripcion))) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.json({ mensaje: 'Servicio actualizado' });
  } catch (error) {
    fallo(res, 'editarServicio', 'Error al actualizar el servicio')(error);
  }
};

// DELETE /api/admin/servicios/:id
const eliminarServicio = async (req, res) => {
  try {
    const r = await admin.eliminarServicio(req.params.id);
    if (r.estado === 'no_existe') return res.status(404).json({ error: 'Servicio no encontrado' });
    if (r.estado === 'en_uso') {
      const partes = [];
      if (r.profesionales) partes.push(`${r.profesionales} profesional(es)`);
      if (r.citas) partes.push(`${r.citas} cita(s)`);
      return res.status(409).json({
        error: `No se puede eliminar: el servicio tiene ${partes.join(' y ') || 'registros asociados'}.`,
      });
    }
    res.json({ mensaje: 'Servicio eliminado' });
  } catch (error) {
    fallo(res, 'eliminarServicio', 'Error al eliminar el servicio')(error);
  }
};

// ---------- Citas ----------
// El admin programa una cita entre un estudiante y un profesional (queda confirmada)
const crearCita = async (req, res) => {
  const { estudiante_id, profesional_id, fecha, hora, motivo } = req.body;

  if (!estudiante_id || !profesional_id || !fecha || !hora) {
    return res.status(400).json({ error: 'Estudiante, profesional, fecha y hora son obligatorios' });
  }
  if (!fechaReal(fecha)) return res.status(400).json({ error: 'La fecha no es válida' });
  if (fecha < hoyTexto()) {
    return res.status(400).json({ error: 'No puedes programar una cita en una fecha pasada' });
  }

  try {
    const [est, prof] = await Promise.all([
      admin.buscarEstudianteActivo(estudiante_id),
      admin.buscarProfesionalActivo(profesional_id),
    ]);
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado o inactivo' });
    if (!prof) return res.status(404).json({ error: 'Profesional no encontrado o inactivo' });

    const libres = await horariosLibres(prof.id, fecha);
    if (!libres.includes(hora)) {
      return res.status(409).json({ error: 'Ese horario no está disponible' });
    }

    const id = await admin.crearCitaConfirmada({
      estudiante_id: est.id,
      profesional_id: prof.id,
      servicio_id: prof.servicio_id,
      fecha,
      hora,
      motivo,
    });

    await admin.notificar(est.usuario_id, `Se programó una cita para ti el ${fecha} a las ${hora}.`);
    await admin.notificar(prof.usuario_id, `Se programó una cita con un estudiante el ${fecha} a las ${hora}.`);

    res.status(201).json({ id, mensaje: 'Cita programada' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ese horario ya fue tomado, elige otro' });
    }
    fallo(res, 'crearCita (admin)', 'Error al programar la cita')(error);
  }
};

const cambiarEstadoCita = async (req, res) => {
  const { estado } = req.body;

  try {
    const cita = await admin.buscarCitaConPartes(req.params.id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

    if (!(TRANSICIONES[cita.estado] || []).includes(estado)) {
      return res.status(400).json({ error: `No se puede pasar una cita de "${cita.estado}" a "${estado}"` });
    }

    await admin.actualizarEstadoCita(cita.id, estado);

    const texto = {
      confirmada: `La cita del ${cita.fecha} a las ${cita.hora} fue confirmada por Bienestar.`,
      cancelada: `La cita del ${cita.fecha} a las ${cita.hora} fue cancelada por Bienestar.`,
      realizada: `La cita del ${cita.fecha} fue marcada como realizada.`,
    }[estado];

    await admin.notificar(cita.estudiante_usuario, texto);
    await admin.notificar(cita.profesional_usuario, texto);

    res.json({ mensaje: 'Estado actualizado' });
  } catch (error) {
    fallo(res, 'cambiarEstadoCita (admin)', 'Error al actualizar la cita')(error);
  }
};

// DELETE /api/admin/citas/:id
const eliminarCita = async (req, res) => {
  try {
    const cita = await admin.eliminarCita(req.params.id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json({ mensaje: 'Cita eliminada' });
  } catch (error) {
    fallo(res, 'eliminarCita (admin)', 'Error al eliminar la cita')(error);
  }
};

module.exports = {
  resumen,
  informes,
  listarEstudiantes,
  crearEstudiante,
  listarProfesionales,
  crearProfesional,
  cambiarActivo,
  listarServicios,
  crearServicio,
  editarServicio,
  eliminarServicio,
  crearCita,
  cambiarEstadoCita,
  eliminarCita,
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { obtenerUsuarioPorEmail } = require('../models/usuarioModel');
const { enviarCorreoRecuperacion } = require('../config/mailer');

// =========================================================
// REGISTRO
// =========================================================
const registrar = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    password,
    tipo_usuario,
    codigo_estudiantil,
    carrera,
    facultad,
    semestre,
  } = req.body;

  if (!nombre || !apellido || !email || !password || !tipo_usuario) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const client = await pool.connect();
  try {
    const existente = await obtenerUsuarioPorEmail(email);
    if (existente) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    }

    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(password, 10);

    const insertUsuario = `
      INSERT INTO usuarios (nombre, apellido, email, password, tipo_usuario)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, apellido, email, tipo_usuario, creado_en`;
    const { rows } = await client.query(insertUsuario, [
      nombre,
      apellido,
      email,
      passwordHash,
      tipo_usuario,
    ]);
    const usuario = rows[0];

    if (tipo_usuario === 'estudiante') {
      if (!codigo_estudiantil) {
        throw new Error('El código estudiantil es obligatorio para estudiantes');
      }
      await client.query(
        `INSERT INTO estudiantes (usuario_id, codigo_estudiantil, carrera, facultad, semestre)
         VALUES ($1, $2, $3, $4, $5)`,
        [usuario.id, codigo_estudiantil, carrera, facultad, semestre]
      );
    }

    await client.query('COMMIT');

    const token = jwt.sign(
      { id: usuario.id, tipo_usuario: usuario.tipo_usuario },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ usuario, token });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en registro:', error.message);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  } finally {
    client.release();
  }
};

// =========================================================
// LOGIN
// =========================================================
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const usuario = await obtenerUsuarioPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Esta cuenta está desactivada' });
    }

    const token = jwt.sign(
      { id: usuario.id, tipo_usuario: usuario.tipo_usuario },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete usuario.password;

    res.json({ usuario, token });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// =========================================================
// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// Genera un token temporal (válido 1 hora) y lo envía por correo
// =========================================================
const solicitarRecuperacion = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El email es obligatorio' });
  }

  try {
    const usuario = await obtenerUsuarioPorEmail(email);

    // Por seguridad, respondemos igual exista o no el email
    // (así nadie puede usar este endpoint para adivinar qué correos están registrados)
    if (!usuario) {
      return res.json({
        mensaje: 'Si el email existe, se enviará un enlace de recuperación',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora desde ahora

    await pool.query(
      'UPDATE usuarios SET reset_token = $1, reset_token_expira = $2 WHERE id = $3',
      [token, expira, usuario.id]
    );

    await enviarCorreoRecuperacion(usuario.email, token);

    res.json({ mensaje: 'Si el email existe, se enviará un enlace de recuperación' });
  } catch (error) {
    console.error('Error en solicitarRecuperacion:', error.message);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

// =========================================================
// RESTABLECER CONTRASEÑA (usando el token recibido por correo)
// =========================================================
const restablecerPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE reset_token = $1',
      [token]
    );
    const usuario = rows[0];

    if (!usuario) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    if (new Date() > new Date(usuario.reset_token_expira)) {
      return res.status(400).json({ error: 'El token ha expirado, solicita uno nuevo' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE usuarios
       SET password = $1, reset_token = NULL, reset_token_expira = NULL
       WHERE id = $2`,
      [passwordHash, usuario.id]
    );

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en restablecerPassword:', error.message);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};

module.exports = { registrar, login, solicitarRecuperacion, restablecerPassword };
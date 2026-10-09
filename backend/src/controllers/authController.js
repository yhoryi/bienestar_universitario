const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { obtenerUsuarioPorEmail } = require('../models/usuarioModel');

// =========================================================
// REGISTRO (público: solo crea estudiantes)
// =========================================================
const registrar = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    password,
    codigo_estudiantil,
    carrera,
    facultad,
    semestre,
  } = req.body;

  // El registro público siempre crea estudiantes.
  // Los profesionales y administradores los crea un admin.
  const tipo_usuario = 'estudiante';

  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (!codigo_estudiantil) {
    return res
      .status(400)
      .json({ error: 'El código estudiantil es obligatorio' });
  }

  const client = await pool.connect();
  try {
    const existente = await obtenerUsuarioPorEmail(email);
    if (existente) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    }

    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await client.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, tipo_usuario)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, apellido, email, tipo_usuario, creado_en`,
      [nombre, apellido, email, passwordHash, tipo_usuario]
    );
    const usuario = rows[0];

    await client.query(
      `INSERT INTO estudiantes (usuario_id, codigo_estudiantil, carrera, facultad, semestre)
       VALUES ($1, $2, $3, $4, $5)`,
      [usuario.id, codigo_estudiantil, carrera, facultad, semestre]
    );

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

// La recuperación de contraseña vive en recuperacionController.js
module.exports = { registrar, login };
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { obtenerUsuarioPorEmail } = require('../models/usuarioModel');

// =========================================================
// REGISTRO
// Crea el usuario base y, si es estudiante, también su
// registro en la tabla "estudiantes" — todo en una sola
// transacción (si algo falla, no se guarda nada).
// =========================================================
const registrar = async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    password,
    tipo_usuario, // 'estudiante' | 'profesional' | 'admin'
    // Campos extra si es estudiante:
    codigo_estudiantil,
    carrera,
    facultad,
    semestre,
  } = req.body;

  // Validación básica
  if (!nombre || !apellido || !email || !password || !tipo_usuario) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const client = await pool.connect();
  try {
    // Verificar que el email no exista ya
    const existente = await obtenerUsuarioPorEmail(email);
    if (existente) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    }

    await client.query('BEGIN');

    // Encriptar la contraseña antes de guardarla
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

    // Si es estudiante, crear también su fila en "estudiantes"
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

    // Generar token para que quede logueado automáticamente tras registrarse
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

    // No devolver el hash de la contraseña al frontend
    delete usuario.password;

    res.json({ usuario, token });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

module.exports = { registrar, login };

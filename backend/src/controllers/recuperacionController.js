const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { obtenerUsuarioPorEmail } = require('../models/usuarioModel');
const { enviarCorreoRecuperacion } = require('../config/mailer');

const MINUTOS_VALIDEZ = 15;
const MAX_INTENTOS = 5;
const MENSAJE_GENERICO = 'Si el email existe, se enviará un código de verificación';

// El código nunca se guarda en texto plano: solo su hash
const hashCodigo = (codigo) =>
  crypto.createHash('sha256').update(String(codigo)).digest('hex');

// Revisa que el código sea correcto, no haya expirado y no se haya
// superado el límite de intentos. Devuelve { usuario } o { status, error }.
const validarCodigo = async (email, codigo) => {
  if (!email || !codigo) {
    return { status: 400, error: 'Email y código son obligatorios' };
  }

  const { rows } = await pool.query(
    `SELECT id, reset_token, reset_token_expira, reset_intentos
     FROM usuarios WHERE email = $1`,
    [email]
  );
  const usuario = rows[0];

  if (!usuario || !usuario.reset_token) {
    return { status: 400, error: 'Código inválido o expirado' };
  }

  if (new Date() > new Date(usuario.reset_token_expira)) {
    return { status: 400, error: 'El código ha expirado, solicita uno nuevo' };
  }

  if (usuario.reset_intentos >= MAX_INTENTOS) {
    return {
      status: 429,
      error: 'Demasiados intentos fallidos, solicita un código nuevo',
    };
  }

  const recibido = Buffer.from(hashCodigo(codigo));
  const guardado = Buffer.from(usuario.reset_token);
  const coincide =
    recibido.length === guardado.length && crypto.timingSafeEqual(recibido, guardado);

  if (!coincide) {
    await pool.query(
      'UPDATE usuarios SET reset_intentos = reset_intentos + 1 WHERE id = $1',
      [usuario.id]
    );
    return { status: 400, error: 'Código incorrecto' };
  }

  return { usuario };
};

// =========================================================
// 1. SOLICITAR CÓDIGO
// =========================================================
const solicitarRecuperacion = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El email es obligatorio' });
  }

  try {
    const usuario = await obtenerUsuarioPorEmail(email);

    // Respondemos igual exista o no el email, para no revelar qué correos están registrados
    if (!usuario) {
      return res.json({ mensaje: MENSAJE_GENERICO });
    }

    const codigo = crypto.randomInt(100000, 1000000); // 6 dígitos
    const expira = new Date(Date.now() + MINUTOS_VALIDEZ * 60 * 1000);

    await pool.query(
      `UPDATE usuarios
       SET reset_token = $1, reset_token_expira = $2, reset_intentos = 0
       WHERE id = $3`,
      [hashCodigo(codigo), expira, usuario.id]
    );

    await enviarCorreoRecuperacion(usuario.email, codigo, MINUTOS_VALIDEZ);

    res.json({ mensaje: MENSAJE_GENERICO });
  } catch (error) {
    console.error('Error en solicitarRecuperacion:', error.message);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

// =========================================================
// 2. VERIFICAR CÓDIGO (no lo consume, solo comprueba que es correcto)
// =========================================================
const verificarCodigo = async (req, res) => {
  const { email, codigo } = req.body;

  try {
    const resultado = await validarCodigo(email, codigo);
    if (resultado.error) {
      return res.status(resultado.status).json({ error: resultado.error });
    }

    res.json({ mensaje: 'Código correcto' });
  } catch (error) {
    console.error('Error en verificarCodigo:', error.message);
    res.status(500).json({ error: 'Error al verificar el código' });
  }
};

// =========================================================
// 3. RESTABLECER CONTRASEÑA (vuelve a validar el código)
// =========================================================
const restablecerPassword = async (req, res) => {
  const { email, codigo, password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'La nueva contraseña es obligatoria' });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const resultado = await validarCodigo(email, codigo);
    if (resultado.error) {
      return res.status(resultado.status).json({ error: resultado.error });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE usuarios
       SET password = $1, reset_token = NULL, reset_token_expira = NULL, reset_intentos = 0
       WHERE id = $2`,
      [passwordHash, resultado.usuario.id]
    );

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en restablecerPassword:', error.message);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};

module.exports = { solicitarRecuperacion, verificarCodigo, restablecerPassword };

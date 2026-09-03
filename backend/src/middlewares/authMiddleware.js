const jwt = require('jsonwebtoken');

// Verifica que la petición traiga un token válido en el header:
// Authorization: Bearer <token>
const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado, falta el token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, tipo_usuario }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Verifica además que el usuario tenga uno de los roles permitidos.
// Uso: verificarRol('admin', 'profesional')
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario.tipo_usuario)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
};

module.exports = { verificarToken, verificarRol };

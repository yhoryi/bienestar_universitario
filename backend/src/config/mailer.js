// Versión simplificada para desarrollo/proyecto académico:
// en vez de enviar un correo real (lo cual requiere que la red permita
// conexiones SMTP salientes, algo que muchas redes universitarias bloquean),
// simplemente mostramos el enlace de recuperación en la consola del servidor.
//
// Esto simula el correo sin depender de un servicio SMTP externo.
// Si más adelante quieres enviar correos reales, solo hay que reemplazar
// esta función por una integración con Gmail, SendGrid, etc.

const enviarCorreoRecuperacion = async (email, token) => {
  const enlace = `http://localhost:5173/restablecer-password?token=${token}`;

  console.log('📧 ---- Simulación de correo de recuperación ----');
  console.log(`Para: ${email}`);
  console.log(`Enlace de recuperación (válido 1 hora): ${enlace}`);
  console.log('------------------------------------------------');

  // No lanza error ni intenta conectarse a ningún servidor externo
  return Promise.resolve();
};

module.exports = { enviarCorreoRecuperacion };
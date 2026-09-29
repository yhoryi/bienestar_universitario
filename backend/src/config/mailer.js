// Envía el código de recuperación por correo.
//
// - Si en el .env están EMAIL_USER y EMAIL_PASS, envía un correo real con Gmail
//   (requiere instalar nodemailer: npm install nodemailer).
// - Si no están definidos, solo muestra el código en la consola del servidor,
//   útil para desarrollo o si la red bloquea las conexiones SMTP.

const enviarCorreoRecuperacion = async (email, codigo, minutos = 15) => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log('📧 ---- Simulación de correo de recuperación ----');
    console.log(`Para: ${email}`);
    console.log(`Código de verificación (válido ${minutos} minutos): ${codigo}`);
    console.log('------------------------------------------------');
    return;
  }

  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  await transporter.sendMail({
    from: `"Bienestar Universitario" <${EMAIL_USER}>`,
    to: email,
    subject: 'Tu código para recuperar la contraseña',
    text: `Tu código de verificación es ${codigo}. Es válido por ${minutos} minutos. Si no lo solicitaste, ignora este mensaje.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 420px; margin: auto; color: #172033;">
        <h2 style="color: #1677c8;">Bienestar Universitario</h2>
        <p>Usa este código para recuperar tu contraseña:</p>
        <p style="font-size: 34px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">${codigo}</p>
        <p style="color: #657286; font-size: 13px;">
          Es válido por ${minutos} minutos. Si no lo solicitaste, ignora este mensaje.
        </p>
      </div>`,
  });
};

module.exports = { enviarCorreoRecuperacion };

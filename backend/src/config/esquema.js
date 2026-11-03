// Prepara automáticamente las columnas nuevas que usan las alertas de riesgo.
// Se ejecuta al iniciar el servidor y es seguro repetirlo: si ya existen, no hace nada.
const pool = require('./db');

const asegurarEsquema = async () => {
  try {
    await pool.query(
      `ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS tipo VARCHAR(30) DEFAULT 'info'`
    );
    await pool.query(
      `ALTER TABLE notificaciones
       ADD COLUMN IF NOT EXISTS estudiante_id INTEGER REFERENCES estudiantes(id) ON DELETE SET NULL`
    );
    console.log('✅ Notificaciones listas para alertas de riesgo');
  } catch (error) {
    console.error('❌ No se pudo preparar la tabla de notificaciones:', error.message);
  }
};

module.exports = { asegurarEsquema };

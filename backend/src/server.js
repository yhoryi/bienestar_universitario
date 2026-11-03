const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS debe ir ANTES de las rutas, para que el navegador reciba
// el permiso en toda petición (incluida la de "preflight" OPTIONS)
app.use(cors());

app.use(express.json());
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
 app.use('/api/citas', require('./routes/citasRoutes'));
   app.use('/api/conversacion', require('./routes/conversacionRoutes'));
      app.use('/api/bienestar', require('./routes/bienestarRoutes'));
         app.use('/api/profesional', require('./routes/profesionalRoutes'));
   app.use('/api/notificaciones', require('./routes/notificacionesRoutes'));
   app.use('/api/admin', require('./routes/adminRoutes'));
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err);
  } else {
    console.log('✅ Conectado a PostgreSQL:', res.rows[0].now);
  }
});
  require('./config/esquema').asegurarEsquema();

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
const express = require('express');
require('dotenv').config();
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err);
  } else {
    console.log('✅ Conectado a PostgreSQL:', res.rows[0].now);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});




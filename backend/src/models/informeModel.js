// Va en: backend/src/models/informeModel.js
// CAPA DE MODELO: consultas de los Informes. Reciben el rango (desde, hasta) como
// YYYY-MM-DD, ambos días incluidos. Solo datos agregados: nunca mensajes ni nombres de estudiantes.
const pool = require('../config/db');

const EN_RANGO = (col) => `${col} >= $1::date AND ${col} < ($2::date + 1)`;

const general = async (desde, hasta) => {
  const p = [desde, hasta];

  const [animo, estres, factores, categorias, porServicio, porEstado, porDia] = await Promise.all([
    pool.query(
      `SELECT ea.nombre, ea.emoji, ea.valor, COUNT(r.id)::int AS total
       FROM estados_animo ea
       LEFT JOIN registros_bienestar r
         ON r.estado_animo_id = ea.id AND ${EN_RANGO('r.fecha_registro')}
       GROUP BY ea.id, ea.nombre, ea.emoji, ea.valor
       ORDER BY ea.valor`,
      p
    ),
    pool.query(
      `SELECT ROUND(AVG(nivel_estres)::numeric, 1) AS promedio, COUNT(*)::int AS registros
       FROM registros_bienestar WHERE ${EN_RANGO('fecha_registro')}`,
      p
    ),
    pool.query(
      `SELECT f.nombre, COUNT(*)::int AS total
       FROM registro_factores rf
       JOIN factores_bienestar f ON f.id = rf.factor_id
       JOIN registros_bienestar r ON r.id = rf.registro_id
       WHERE ${EN_RANGO('r.fecha_registro')}
       GROUP BY f.nombre ORDER BY total DESC LIMIT 6`,
      p
    ),
    pool.query(
      `SELECT COALESCE(categoria_detectada, 'otro') AS categoria, COUNT(*)::int AS total
       FROM consultas_ia WHERE ${EN_RANGO('fecha')}
       GROUP BY 1 ORDER BY total DESC LIMIT 8`,
      p
    ),
    pool.query(
      `SELECT s.nombre, COUNT(c.id)::int AS total
       FROM servicios s
       LEFT JOIN citas c ON c.servicio_id = s.id AND c.fecha BETWEEN $1::date AND $2::date
       GROUP BY s.id, s.nombre ORDER BY total DESC, s.nombre`,
      p
    ),
    pool.query(
      `SELECT estado, COUNT(*)::int AS total FROM citas
       WHERE fecha BETWEEN $1::date AND $2::date GROUP BY estado ORDER BY total DESC`,
      p
    ),
    pool.query(
      `SELECT to_char(d::date, 'YYYY-MM-DD') AS dia, COUNT(r.id)::int AS total
       FROM generate_series($1::date, $2::date, '1 day') d
       LEFT JOIN registros_bienestar r ON r.fecha_registro::date = d::date
       GROUP BY d ORDER BY d`,
      p
    ),
  ]);

  return {
    animo: animo.rows,
    estres: {
      promedio: estres.rows[0].promedio === null ? null : Number(estres.rows[0].promedio),
      registros: estres.rows[0].registros,
    },
    factores: factores.rows,
    categorias: categorias.rows,
    citas_servicio: porServicio.rows,
    citas_estado: porEstado.rows,
    checkins_por_dia: porDia.rows,
  };
};

// Informe por profesional: JOIN de 4 tablas + GROUP BY con conteos condicionales (FILTER).
// LEFT JOIN a citas para que aparezcan también los profesionales sin citas en el rango.
const porProfesional = async (desde, hasta) => {
  const { rows } = await pool.query(
    `SELECT p.id,
            u.nombre || ' ' || u.apellido AS profesional,
            s.nombre AS servicio,
            COUNT(c.id)::int AS total,
            COUNT(*) FILTER (WHERE c.estado = 'pendiente')::int  AS pendientes,
            COUNT(*) FILTER (WHERE c.estado = 'confirmada')::int AS confirmadas,
            COUNT(*) FILTER (WHERE c.estado = 'realizada')::int  AS realizadas,
            COUNT(*) FILTER (WHERE c.estado = 'cancelada')::int  AS canceladas,
            COUNT(DISTINCT c.estudiante_id)::int AS estudiantes_atendidos
     FROM profesionales p
     JOIN usuarios u ON u.id = p.usuario_id
     JOIN servicios s ON s.id = p.servicio_id
     LEFT JOIN citas c ON c.profesional_id = p.id
                      AND c.fecha BETWEEN $1::date AND $2::date
     GROUP BY p.id, u.nombre, u.apellido, s.nombre
     ORDER BY total DESC, profesional`,
    [desde, hasta]
  );
  return rows;
};

module.exports = { general, porProfesional };

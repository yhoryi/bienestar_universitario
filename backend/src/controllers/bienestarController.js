const pool = require('../config/db');

const idEstudiante = async (usuarioId) => {
  const { rows } = await pool.query('SELECT id FROM estudiantes WHERE usuario_id = $1', [usuarioId]);
  return rows[0]?.id;
};

// Opciones para armar el formulario: estados de ánimo y factores
const opciones = async (req, res) => {
  try {
    const [estados, factores] = await Promise.all([
      pool.query('SELECT id, nombre, emoji, valor FROM estados_animo ORDER BY valor'),
      pool.query('SELECT id, nombre FROM factores_bienestar ORDER BY id'),
    ]);
    res.json({ estados: estados.rows, factores: factores.rows });
  } catch (error) {
    console.error('Error en opciones:', error.message);
    res.status(500).json({ error: 'Error al cargar las opciones' });
  }
};

// Guardar un check-in: ánimo + estrés + factores + comentario
const crearRegistro = async (req, res) => {
  const { estado_animo_id, nivel_estres, factores = [], comentario } = req.body;

  const estres = Number(nivel_estres);
  if (!estado_animo_id) {
    return res.status(400).json({ error: 'Elige cómo te sientes' });
  }
  if (!Number.isInteger(estres) || estres < 1 || estres > 5) {
    return res.status(400).json({ error: 'El nivel de estrés debe ser de 1 a 5' });
  }
  if (!Array.isArray(factores)) {
    return res.status(400).json({ error: 'Los factores no son válidos' });
  }
  if (comentario && comentario.length > 1000) {
    return res.status(400).json({ error: 'El comentario es demasiado largo (máx. 1000 caracteres)' });
  }

  const idsFactores = [...new Set(factores.map(Number))].filter(Number.isInteger);

  const client = await pool.connect();
  try {
    const estudianteId = await idEstudiante(req.usuario.id);
    if (!estudianteId) {
      return res.status(403).json({ error: 'Tu cuenta no tiene perfil de estudiante' });
    }

    const estado = await client.query('SELECT id, valor FROM estados_animo WHERE id = $1', [
      estado_animo_id,
    ]);
    if (!estado.rows[0]) {
      return res.status(400).json({ error: 'El estado de ánimo no es válido' });
    }

    if (idsFactores.length > 0) {
      const validos = await client.query(
        'SELECT id FROM factores_bienestar WHERE id = ANY($1::int[])',
        [idsFactores]
      );
      if (validos.rowCount !== idsFactores.length) {
        return res.status(400).json({ error: 'Alguno de los factores no es válido' });
      }
    }

    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO registros_bienestar (estudiante_id, estado_animo_id, nivel_estres, comentario)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [estudianteId, estado_animo_id, estres, comentario?.trim() || null]
    );

    for (const factorId of idsFactores) {
      await client.query('INSERT INTO registro_factores (registro_id, factor_id) VALUES ($1, $2)', [
        rows[0].id,
        factorId,
      ]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      id: rows[0].id,
      mensaje: 'Registro guardado',
      estado_valor: estado.rows[0].valor,
      nivel_estres: estres,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error en crearRegistro:', error.message);
    res.status(500).json({ error: 'Error al guardar tu registro' });
  } finally {
    client.release();
  }
};

// Registros que el estudiante ya hizo hoy
const registrosHoy = async (req, res) => {
  try {
    const estudianteId = await idEstudiante(req.usuario.id);
    if (!estudianteId) return res.json([]);

    const { rows } = await pool.query(
      `SELECT r.id, to_char(r.fecha_registro, 'HH24:MI') AS hora, r.nivel_estres,
              ea.nombre AS estado, ea.emoji, ea.valor
       FROM registros_bienestar r
       JOIN estados_animo ea ON ea.id = r.estado_animo_id
       WHERE r.estudiante_id = $1 AND r.fecha_registro::date = CURRENT_DATE
       ORDER BY r.fecha_registro DESC`,
      [estudianteId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en registrosHoy:', error.message);
    res.status(500).json({ error: 'Error al obtener tus registros' });
  }
};

module.exports = { opciones, crearRegistro, registrosHoy };

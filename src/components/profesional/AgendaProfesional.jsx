// Va en: src/components/profesional/AgendaProfesional.jsx
import { useState } from "react";
import { formatearFecha, ETIQUETAS_ESTADO } from "../../services/citasApi";

const hoyTexto = () => new Date().toLocaleDateString("en-CA");

function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString("en-CA");
}

const RANGOS = [
  { dias: 7, texto: "7 días" },
  { dias: 14, texto: "14 días" },
  { dias: 30, texto: "30 días" },
];

function AgendaProfesional({ citas }) {
  const [rango, setRango] = useState(7);

  const hoy = hoyTexto();
  const hasta = sumarDias(hoy, rango);

  const visibles = citas
    .filter((c) => (c.estado === "pendiente" || c.estado === "confirmada") && c.fecha >= hoy && c.fecha <= hasta)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  // Agrupar por día
  const dias = visibles.reduce((acc, c) => {
    (acc[c.fecha] = acc[c.fecha] || []).push(c);
    return acc;
  }, {});
  const fechas = Object.keys(dias).sort();

  return (
    <div className="modulo modulo-ancho">
      <header className="modulo-encabezado">
        <h1>Agenda</h1>
        <p>Tus citas pendientes y confirmadas, organizadas por día.</p>
      </header>

      <div className="filtros">
        {RANGOS.map((r) => (
          <button
            key={r.dias}
            className={`filtro ${rango === r.dias ? "activo" : ""}`}
            onClick={() => setRango(r.dias)}
          >
            Próximos {r.texto}
          </button>
        ))}
      </div>

      {fechas.length === 0 ? (
        <div className="tarjeta">
          <p className="citas-vacio">No tienes citas en los próximos {rango} días.</p>
        </div>
      ) : (
        fechas.map((fecha) => (
          <section className="tarjeta dia-agenda" key={fecha}>
            <h2 className="dia-titulo">
              {formatearFecha(fecha)}
              {fecha === hoy && <span className="hoy-tag">Hoy</span>}
            </h2>
            <div className="lista-citas">
              {dias[fecha].map((c) => (
                <div className="item-cita" key={c.id}>
                  <div className="item-hora">{c.hora}</div>
                  <div className="item-datos">
                    <strong>
                      {c.estudiante_nombre} {c.estudiante_apellido}
                    </strong>
                    <span>
                      {c.servicio}
                      {c.motivo ? ` — ${c.motivo}` : ""}
                    </span>
                  </div>
                  <span className={`estado-badge estado-${c.estado}`}>{ETIQUETAS_ESTADO[c.estado]}</span>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

export default AgendaProfesional;

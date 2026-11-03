// Va en: src/components/profesional/ResumenProfesional.jsx
import { CalendarClock, Inbox, CalendarCheck, CheckCheck, ArrowRight } from "lucide-react";
import { formatearFecha, ETIQUETAS_ESTADO } from "../../services/citasApi";

const hoyTexto = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function ItemCita({ c }) {
  return (
    <div className="item-cita">
      <div className="item-hora">{c.hora}</div>
      <div className="item-datos">
        <strong>
          {c.estudiante_nombre} {c.estudiante_apellido}
        </strong>
        <span>
          {c.servicio}
          {c.estudiante_carrera ? ` · ${c.estudiante_carrera}` : ""}
        </span>
      </div>
      <span className={`estado-badge estado-${c.estado}`}>{ETIQUETAS_ESTADO[c.estado]}</span>
    </div>
  );
}

function ResumenProfesional({ citas, nombre, onIr }) {
  const hoy = hoyTexto();
  const mes = hoy.slice(0, 7);
  const ordenar = (a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora);

  const activas = citas.filter((c) => c.estado === "pendiente" || c.estado === "confirmada");
  const deHoy = activas.filter((c) => c.fecha === hoy).sort(ordenar);
  const pendientes = citas.filter((c) => c.estado === "pendiente");
  const proximas = citas
    .filter((c) => c.estado === "confirmada" && c.fecha > hoy)
    .sort(ordenar)
    .slice(0, 5);
  const realizadasMes = citas.filter((c) => c.estado === "realizada" && c.fecha.startsWith(mes));

  const tarjetas = [
    { icono: CalendarClock, valor: deHoy.length, texto: "Citas de hoy", clase: "azul" },
    { icono: Inbox, valor: pendientes.length, texto: "Por revisar", clase: "ambar" },
    { icono: CalendarCheck, valor: proximas.length, texto: "Próximas confirmadas", clase: "verde" },
    { icono: CheckCheck, valor: realizadasMes.length, texto: "Realizadas este mes", clase: "gris" },
  ];

  return (
    <div className="modulo modulo-ancho">
      <header className="modulo-encabezado">
        <h1>
          {saludo()}, {nombre}
        </h1>
        <p>Este es el resumen de tu actividad en Bienestar Universitario.</p>
      </header>

      <div className="stats">
        {tarjetas.map(({ icono: Icono, valor, texto, clase }) => (
          <div className={`stat-card ${clase}`} key={texto}>
            <div className="stat-icono">
              <Icono size={22} />
            </div>
            <strong>{valor}</strong>
            <span>{texto}</span>
          </div>
        ))}
      </div>

      {pendientes.length > 0 && (
        <button className="aviso-pendientes" onClick={() => onIr("citas")}>
          <Inbox size={20} />
          <span>
            Tienes <b>{pendientes.length}</b> {pendientes.length === 1 ? "solicitud" : "solicitudes"} de
            cita por revisar
          </span>
          <ArrowRight size={18} />
        </button>
      )}

      <section className="tarjeta">
        <h2>Agenda de hoy</h2>
        {deHoy.length === 0 ? (
          <p className="citas-vacio">No tienes citas programadas para hoy.</p>
        ) : (
          <div className="lista-citas">
            {deHoy.map((c) => (
              <ItemCita key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>

      <section className="tarjeta">
        <h2>Próximas citas confirmadas</h2>
        {proximas.length === 0 ? (
          <p className="citas-vacio">Aún no hay citas confirmadas para los próximos días.</p>
        ) : (
          <div className="lista-citas">
            {proximas.map((c) => (
              <div key={c.id}>
                <div className="fecha-etiqueta">{formatearFecha(c.fecha)}</div>
                <ItemCita c={c} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ResumenProfesional;

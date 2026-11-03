// Va en: src/components/Notificaciones.jsx  (reemplaza el anterior; sirve para cualquier rol)
import { useEffect, useState } from "react";
import { Bell, CheckCheck, ShieldAlert, Mail } from "lucide-react";
import { api } from "../services/http";

function formatear(fecha) {
  return new Date(fecha).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Una notificación como las demás, pero en rojo suave y con los datos del estudiante
function AlertaRiesgo({ n, onAtender }) {
  const nombre = n.est_nombre ? `${n.est_nombre} ${n.est_apellido}` : "Un estudiante";
  const datos = [
    ["Código", n.est_codigo],
    ["Carrera", n.est_carrera],
    ["Facultad", n.est_facultad],
    ["Semestre", n.est_semestre],
    ["Correo", n.est_email],
  ].filter(([, valor]) => valor !== null && valor !== undefined && valor !== "");

  return (
    <div className={`alerta-item ${n.leida ? "atendida" : ""}`}>
      <div className="alerta-fila">
        <span className="alerta-icono">
          <ShieldAlert size={18} />
        </span>

        <div className="alerta-texto">
          <span className="alerta-titulo">
            Alerta de riesgo · <b>{nombre}</b>
            {!n.leida && <em className="alerta-etiqueta">Urgente</em>}
          </span>
          <span className="alerta-detalle">
            {n.leida
              ? "Esta alerta ya fue atendida."
              : "Podría estar en una situación de riesgo y necesita atención prioritaria."}
          </span>
          <small>{formatear(n.fecha)}</small>
        </div>
      </div>

      {datos.length > 0 && (
        <dl className="alerta-datos">
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt>{etiqueta}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {!n.leida && (
        <div className="alerta-acciones">
          {n.est_email && (
            <a className="alerta-boton principal" href={`mailto:${n.est_email}`}>
              <Mail size={15} /> Escribir al estudiante
            </a>
          )}
          <button className="alerta-boton" onClick={() => onAtender(n)}>
            <CheckCheck size={15} /> Marcar como atendida
          </button>
        </div>
      )}
    </div>
  );
}

function Notificaciones({ onCambio }) {
  const [lista, setLista] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargar = () =>
    api("/notificaciones")
      .then(setLista)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const leer = async (n) => {
    if (n.leida) return;
    try {
      await api(`/notificaciones/${n.id}/leer`, { method: "PATCH" });
      setLista((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
      onCambio?.();
    } catch (err) {
      setError(err.message);
    }
  };

  // Las alertas de riesgo no se incluyen: se atienden una por una
  const leerAvisos = async () => {
    try {
      await api("/notificaciones/leer-todas", { method: "PATCH" });
      setLista((prev) => prev.map((x) => (x.tipo === "alerta_riesgo" ? x : { ...x, leida: true })));
      onCambio?.();
    } catch (err) {
      setError(err.message);
    }
  };

  const alertasPendientes = lista.filter((n) => n.tipo === "alerta_riesgo" && !n.leida).length;
  const avisosSinLeer = lista.filter((n) => n.tipo !== "alerta_riesgo" && !n.leida).length;
  const sinLeer = alertasPendientes + avisosSinLeer;

  return (
    <div className="modulo modulo-ancho">
      <header className="modulo-encabezado">
        <h1>Notificaciones</h1>
        <p>Alertas de riesgo y avisos sobre tus citas.</p>
      </header>

      {error && <div className="auth-error">{error}</div>}

      <section className="tarjeta">
        <div className="notif-cabecera">
          <h2>{sinLeer > 0 ? `${sinLeer} sin leer` : "Todo al día"}</h2>
          {avisosSinLeer > 0 && (
            <button className="btn-cita btn-ok" onClick={leerAvisos}>
              <CheckCheck size={15} /> Marcar avisos como leídos
            </button>
          )}
        </div>

        {!cargando && lista.length === 0 ? (
          <div className="notif-vacio">
            <Bell size={30} />
            <p>Aún no tienes notificaciones.</p>
          </div>
        ) : (
          <div className="notif-lista">
            {lista.map((n) =>
              n.tipo === "alerta_riesgo" ? (
                <AlertaRiesgo key={n.id} n={n} onAtender={leer} />
              ) : (
                <button
                  key={n.id}
                  className={`notif-item ${n.leida ? "leida" : ""}`}
                  onClick={() => leer(n)}
                  title={n.leida ? "" : "Marcar como leída"}
                >
                  <span className="notif-punto" />
                  <span className="notif-texto">
                    <span>{n.mensaje}</span>
                    <small>{formatear(n.fecha)}</small>
                  </span>
                </button>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default Notificaciones;

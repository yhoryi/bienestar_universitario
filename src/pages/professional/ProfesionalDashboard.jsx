// Va en: src/pages/professional/ProfesionalDashboard.jsx  (reemplaza el actual)
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, Home, CalendarCheck, CalendarDays, Clock, Bell, User, LogOut, ShieldAlert, ArrowRight, X,
} from "lucide-react";
import { cerrarSesion } from "../../utils/auth";
import { api } from "../../services/http";
import CitasProfesional from "../../components/CitasProfesional";
import Notificaciones from "../../components/Notificaciones";
import ResumenProfesional from "../../components/profesional/ResumenProfesional";
import AgendaProfesional from "../../components/profesional/AgendaProfesional";
import DisponibilidadProfesional from "../../components/profesional/DisponibilidadProfesional";
import PerfilProfesional from "../../components/profesional/PerfilProfesional";

// Para agregar un módulo nuevo: añádelo aquí y en la función "contenido".
const MODULOS = [
  { id: "inicio", nombre: "Inicio", icono: Home },
  { id: "citas", nombre: "Solicitudes", icono: CalendarCheck },
  { id: "agenda", nombre: "Agenda", icono: CalendarDays },
  { id: "disponibilidad", nombre: "Disponibilidad", icono: Clock },
  { id: "notificaciones", nombre: "Notificaciones", icono: Bell },
  { id: "perfil", nombre: "Mi perfil", icono: User },
];

// "hace un momento", "hace 5 min", "hace 2 h"
function hace(fecha) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
  if (minutos < 1) return "hace un momento";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  return horas < 24 ? `hace ${horas} h` : `hace ${Math.round(horas / 24)} d`;
}

function ProfesionalDashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  const [modulo, setModulo] = useState("inicio");
  const [citas, setCitas] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [alertas, setAlertas] = useState(0);
  const [ultimaAlerta, setUltimaAlerta] = useState(null);
  const [alertaCerrada, setAlertaCerrada] = useState(null); // id de la alerta cuyo aviso se cerró

  // Datos compartidos por varios módulos y contadores del menú
  const actualizar = useCallback(() => {
    api("/citas/profesional").then(setCitas).catch(() => {});
    api("/notificaciones/contador")
      .then((d) => {
        setNoLeidas(d.no_leidas);
        setAlertas(d.alertas_sin_leer);
        setUltimaAlerta(d.ultima_alerta);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    actualizar();
    const temporizador = setInterval(actualizar, 30000); // se refresca cada 30 segundos
    return () => clearInterval(temporizador);
  }, [actualizar]);

  const handleLogout = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };

  const pendientes = citas.filter((c) => c.estado === "pendiente").length;
  const contadores = { citas: pendientes, notificaciones: noLeidas };

  const mostrarAviso =
    alertas > 0 && ultimaAlerta && ultimaAlerta.id !== alertaCerrada && modulo !== "notificaciones";

  const nombreAlerta = ultimaAlerta?.nombre
    ? `${ultimaAlerta.nombre} ${ultimaAlerta.apellido}`
    : "Un estudiante";

  const contenido = () => {
    switch (modulo) {
      case "inicio":
        return <ResumenProfesional citas={citas} nombre={usuario?.nombre} onIr={setModulo} />;
      case "citas":
        return (
          <div className="modulo modulo-ancho">
            <header className="modulo-encabezado">
              <h1>Solicitudes de citas</h1>
              <p>Revisa las solicitudes de los estudiantes y confirma, rechaza o cierra cada cita.</p>
            </header>
            <CitasProfesional onCambio={actualizar} />
          </div>
        );
      case "agenda":
        return <AgendaProfesional citas={citas} />;
      case "disponibilidad":
        return <DisponibilidadProfesional />;
      case "notificaciones":
        return <Notificaciones onCambio={actualizar} />;
      case "perfil":
        return <PerfilProfesional />;
      default:
        return null;
    }
  };

  return (
    <div className="student-app">
      <aside className="student-sidebar">
        <div className="student-brand">
          <div className="logo-icon">
            <Heart size={22} />
          </div>
          <div>
            <h2>Bienestar</h2>
            <span>Universitario</span>
          </div>
        </div>

        <nav className="student-nav">
          {MODULOS.map(({ id, nombre, icono: Icono }) => (
            <button
              key={id}
              className={`nav-item ${modulo === id ? "activo" : ""}`}
              onClick={() => setModulo(id)}
            >
              <Icono size={19} />
              <span>{nombre}</span>
              {id === "notificaciones" && alertas > 0 ? (
                <em className="contador-nav urgente">{alertas}</em>
              ) : (
                contadores[id] > 0 && <em className="contador-nav">{contadores[id]}</em>
              )}
            </button>
          ))}
        </nav>

        <div className="student-usuario">
          <div className="avatar">{usuario?.nombre?.[0]?.toUpperCase() || "P"}</div>
          <div className="usuario-datos">
            <strong>
              {usuario?.nombre} {usuario?.apellido}
            </strong>
            <span>Profesional</span>
          </div>
          <button className="btn-salir" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="student-content">{contenido()}</main>

      {/* Aviso emergente cuando llega (o hay pendiente) una alerta de riesgo */}
      {mostrarAviso && (
        <div className="aviso-alerta" role="alert">
          <span className="aviso-icono">
            <ShieldAlert size={20} />
          </span>

          <div className="aviso-cuerpo">
            <strong>Alerta de riesgo{alertas > 1 ? ` · ${alertas} pendientes` : ""}</strong>
            <span>{nombreAlerta} podría necesitar atención prioritaria.</span>
            <small>{hace(ultimaAlerta.fecha)}</small>
            <button className="aviso-ver" onClick={() => setModulo("notificaciones")}>
              Ver alerta <ArrowRight size={14} />
            </button>
          </div>

          <button
            className="aviso-cerrar"
            onClick={() => setAlertaCerrada(ultimaAlerta.id)}
            aria-label="Cerrar aviso"
            title="Cerrar aviso"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfesionalDashboard;

// Va en: src/pages/student/StudentDashboard.jsx  (reemplaza el actual)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Smile,
  MessageCircle,
  TrendingUp,
  CalendarDays,
  LogOut,
} from "lucide-react";
import { cerrarSesion } from "../../utils/auth";
import CheckinBienestar from "../../components/CheckinBienestar";
import CitasEstudiante from "../../components/CitasEstudiante";
import ConversacionIA from "../../components/ConversacionIA";

// Para agregar un módulo nuevo: añádelo aquí y en el bloque "contenido" de abajo.
const MODULOS = [
  { id: "inicio", nombre: "Inicio", icono: Smile },
  { id: "conversacion", nombre: "Conversación", icono: MessageCircle },
  { id: "seguimiento", nombre: "Mi seguimiento", icono: TrendingUp, pronto: true },
  { id: "citas", nombre: "Citas", icono: CalendarDays },
];

function Proximamente({ nombre }) {
  return (
    <div className="modulo">
      <div className="proximamente">
        <Heart size={34} />
        <h2>{nombre}</h2>
        <p>Este módulo estará disponible muy pronto.</p>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const [modulo, setModulo] = useState("inicio");

  const handleLogout = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };

  const actual = MODULOS.find((m) => m.id === modulo);

  const contenido = () => {
    if (modulo === "inicio") return <CheckinBienestar onIrACitas={() => setModulo("citas")} />;
    if (modulo === "conversacion")
      return (
        <ConversacionIA nombre={usuario?.nombre} onIrACitas={() => setModulo("citas")} />
      );
    if (modulo === "citas")
      return (
        <div className="modulo">
          <header className="modulo-encabezado">
            <h1>Citas</h1>
            <p>Solicita una cita con los servicios de Bienestar y revisa su estado.</p>
          </header>
          <CitasEstudiante />
        </div>
      );
    return <Proximamente nombre={actual.nombre} />;
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
          {MODULOS.map(({ id, nombre, icono: Icono, pronto }) => (
            <button
              key={id}
              className={`nav-item ${modulo === id ? "activo" : ""}`}
              onClick={() => setModulo(id)}
            >
              <Icono size={19} />
              <span>{nombre}</span>
              {pronto && <em className="pronto">Pronto</em>}
            </button>
          ))}
        </nav>

        <div className="student-usuario">
          <div className="avatar">{usuario?.nombre?.[0]?.toUpperCase() || "E"}</div>
          <div className="usuario-datos">
            <strong>
              {usuario?.nombre} {usuario?.apellido}
            </strong>
            <span>Estudiante</span>
          </div>
          <button className="btn-salir" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="student-content">{contenido()}</main>
    </div>
  );
}

export default StudentDashboard;

// Va en: src/pages/admin/AdminDashboard.jsx  (reemplaza el actual: es el tuyo + sección Informes)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  Stethoscope,
  GraduationCap,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import ResumenAdmin from "../../components/admin/ResumenAdmin";
import CitasAdmin from "../../components/admin/CitasAdmin";
import ProfesionalesAdmin from "../../components/admin/ProfesionalesAdmin";
import EstudiantesAdmin from "../../components/admin/EstudiantesAdmin";
import ServiciosAdmin from "../../components/admin/ServiciosAdmin";
import InformesAdmin from "../../components/admin/InformesAdmin";
import "../../components/admin/AdminDashboard.css";

const SECCIONES = [
  { id: "resumen", texto: "Resumen", icono: LayoutDashboard, Vista: ResumenAdmin },
  { id: "citas", texto: "Citas", icono: CalendarDays, Vista: CitasAdmin },
  { id: "profesionales", texto: "Profesionales", icono: Stethoscope, Vista: ProfesionalesAdmin },
  { id: "estudiantes", texto: "Estudiantes", icono: GraduationCap, Vista: EstudiantesAdmin },
  { id: "servicios", texto: "Servicios", icono: ClipboardList, Vista: ServiciosAdmin },
  { id: "informes", texto: "Informes", icono: BarChart3, Vista: InformesAdmin },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState("resumen");

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const esAdmin = Boolean(localStorage.getItem("token")) && usuario?.tipo_usuario === "admin";

  useEffect(() => {
    if (!esAdmin) navigate("/login");
  }, [esAdmin, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  if (!esAdmin) return null;

  const { Vista } = SECCIONES.find((s) => s.id === seccion);

  return (
    <div className="ad-pagina">
      <header className="ad-cabecera">
        <div className="ad-titulo">
          <Heart size={26} />
          <div>
            <h1>Panel administrativo</h1>
            <span>Bienestar Universitario · {usuario?.nombre}</span>
          </div>
        </div>
        <button type="button" className="ad-btn" onClick={handleLogout}>
          <LogOut size={16} /> Cerrar sesión
        </button>
      </header>

      <nav className="ad-pestanas" aria-label="Secciones del panel">
        {SECCIONES.map(({ id, texto, icono: Icono }) => (
          <button
            key={id}
            type="button"
            className={seccion === id ? "activa" : ""}
            aria-current={seccion === id ? "page" : undefined}
            onClick={() => setSeccion(id)}
          >
            <Icono size={17} />
            {texto}
          </button>
        ))}
      </nav>

      <main className="ad-contenido">
        <Vista />
      </main>
    </div>
  );
}

export default AdminDashboard;

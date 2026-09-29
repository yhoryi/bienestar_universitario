import { useNavigate } from "react-router-dom";
import { Heart, LogOut } from "lucide-react";

function StudentDashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  return (
    <div style={{ padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Heart size={28} />
          <h1>Hola, {usuario?.nombre || "estudiante"} 👋</h1>
        </div>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>

      <p style={{ marginTop: "20px" }}>
        Bienvenido a tu panel de Bienestar Universitario. Aquí podrás registrar cómo te sientes,
        conversar con el asistente y solicitar citas.
      </p>
    </div>
  );
}

export default StudentDashboard;

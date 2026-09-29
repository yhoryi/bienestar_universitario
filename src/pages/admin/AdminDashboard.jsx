import { useNavigate } from "react-router-dom";
import { Heart, LogOut } from "lucide-react";

function AdminDashboard() {
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
          <h1>Panel administrativo</h1>
        </div>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>

      <p style={{ marginTop: "20px" }}>
        Bienvenido, {usuario?.nombre}. Aquí podrás gestionar profesionales, solicitudes y ver
        estadísticas generales de la plataforma.
      </p>
    </div>
  );
}

export default AdminDashboard;

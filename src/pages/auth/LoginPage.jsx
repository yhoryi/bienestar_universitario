import { useState } from "react";
import { Heart, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Por favor ingresa tu correo y contraseña");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        // 401: credenciales incorrectas | 403: cuenta desactivada
        setError(datos.error || "No se pudo iniciar sesión");
        return;
      }

      localStorage.setItem("token", datos.token);
      localStorage.setItem("usuario", JSON.stringify(datos.usuario));

      // Redirige según el rol del usuario
      if (datos.usuario.tipo_usuario === "admin") {
        navigate("/admin");
      } else if (datos.usuario.tipo_usuario === "profesional") {
        navigate("/profesional");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error de conexión:", err);
      setError("No se pudo conectar con el servidor. Intenta más tarde.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">
            <Heart size={24} />
          </div>

          <div>
            <h2>Bienestar</h2>
            <span>Universitario</span>
          </div>
        </div>

        <div className="auth-header">
          <h1>Bienvenido</h1>
          <p>Ingresa a tu cuenta para continuar</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              placeholder="correo@universidad.edu.co"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="Ingresa tu contraseña"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="forgot-password">
            <button type="button" onClick={() => navigate("/recuperar-password")}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button type="submit" className="auth-button" disabled={cargando}>
            <LogIn size={19} />
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="auth-divider">
          <span>¿No tienes una cuenta?</span>
        </div>

        <button className="register-link" onClick={() => navigate("/register")}>
          Crear una cuenta
        </button>

        <button className="back-home" onClick={() => navigate("/")}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default LoginPage;

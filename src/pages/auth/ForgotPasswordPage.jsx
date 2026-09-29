import { useState } from "react";
import { Heart, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(`${API_URL}/auth/solicitar-recuperacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setError(datos.error || "No se pudo enviar el código");
        return;
      }

      // Pasamos el correo a la siguiente pantalla, donde se ingresa el código
      navigate("/restablecer-password", { state: { email: email.trim() } });
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
          <h1>Recupera tu contraseña</h1>
          <p>
            Ingresa tu correo y te enviaremos un código de 6 dígitos para
            crear una nueva contraseña.
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              placeholder="correo@universidad.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-button" disabled={cargando}>
            <Mail size={19} />
            {cargando ? "Enviando..." : "Enviar código"}
          </button>
        </form>

        <button className="back-home" onClick={() => navigate("/login")}>
          ← Volver a iniciar sesión
        </button>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;

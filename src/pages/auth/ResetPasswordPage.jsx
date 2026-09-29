import { useState, useEffect } from "react";
import { Heart, KeyRound, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const API_URL = "http://localhost:5000/api/auth";

async function post(ruta, cuerpo) {
  const respuesta = await fetch(`${API_URL}/${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json().catch(() => ({}));
  return { ok: respuesta.ok, datos };
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  // paso: "codigo" -> "password" -> "exito"
  const [paso, setPaso] = useState("codigo");
  const [codigo, setCodigo] = useState("");
  const [formData, setFormData] = useState({ password: "", confirmar: "" });

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cargando, setCargando] = useState(false);

  // Si se llega aquí sin haber pedido el código, volvemos al inicio del flujo
  useEffect(() => {
    if (!email) navigate("/recuperar-password", { replace: true });
  }, [email, navigate]);

  if (!email) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const conexionFallida = (err) => {
    console.error("Error de conexión:", err);
    setError("No se pudo conectar con el servidor. Intenta más tarde.");
  };

  // Paso 1: comprobar el código
  const handleVerificar = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (codigo.length !== 6) {
      setError("El código tiene 6 dígitos");
      return;
    }

    setCargando(true);
    try {
      const { ok, datos } = await post("verificar-codigo", { email, codigo });
      if (!ok) {
        setError(datos.error || "No se pudo verificar el código");
        return;
      }
      setPaso("password");
    } catch (err) {
      conexionFallida(err);
    } finally {
      setCargando(false);
    }
  };

  // Paso 2: guardar la nueva contraseña
  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.password || !formData.confirmar) {
      setError("Por favor completa ambos campos");
      return;
    }
    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (formData.password !== formData.confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setCargando(true);
    try {
      const { ok, datos } = await post("restablecer-password", {
        email,
        codigo,
        password: formData.password,
      });
      if (!ok) {
        setError(datos.error || "No se pudo actualizar la contraseña");
        return;
      }
      setPaso("exito");
    } catch (err) {
      conexionFallida(err);
    } finally {
      setCargando(false);
    }
  };

  // Pedir un código nuevo
  const handleReenviar = async () => {
    setError("");
    setInfo("");
    setCodigo("");
    setCargando(true);
    try {
      const { ok, datos } = await post("solicitar-recuperacion", { email });
      if (!ok) {
        setError(datos.error || "No se pudo reenviar el código");
        return;
      }
      setInfo("Te enviamos un código nuevo.");
    } catch (err) {
      conexionFallida(err);
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

        {paso === "codigo" && (
          <>
            <div className="auth-header">
              <h1>Ingresa el código</h1>
              <p>
                Enviamos un código de 6 dígitos a <strong>{email}</strong>.
                Es válido por 15 minutos.
              </p>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {info && <div className="auth-info">{info}</div>}

            <form onSubmit={handleVerificar}>
              <div className="form-group">
                <label>Código de verificación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="code-input"
                  placeholder="000000"
                  value={codigo}
                  onChange={(e) =>
                    setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
              </div>

              <button type="submit" className="auth-button" disabled={cargando}>
                <ShieldCheck size={19} />
                {cargando ? "Verificando..." : "Verificar código"}
              </button>
            </form>

            <button
              className="link-button"
              onClick={handleReenviar}
              disabled={cargando}
            >
              ¿No te llegó? Enviar código nuevo
            </button>

            <button
              className="back-home"
              onClick={() => navigate("/recuperar-password")}
            >
              ← Usar otro correo
            </button>
          </>
        )}

        {paso === "password" && (
          <>
            <div className="auth-header">
              <h1>Nueva contraseña</h1>
              <p>Elige una contraseña de al menos 8 caracteres.</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleGuardar}>
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  name="confirmar"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmar}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="auth-button" disabled={cargando}>
                <KeyRound size={19} />
                {cargando ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          </>
        )}

        {paso === "exito" && (
          <div className="auth-success-block">
            <div className="auth-success-icon">
              <CheckCircle2 size={30} />
            </div>

            <div className="auth-header">
              <h1>Contraseña actualizada</h1>
              <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            </div>

            <button className="auth-button" onClick={() => navigate("/login")}>
              Ir a iniciar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;

import { useState } from "react";
import { Heart, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    codigo_estudiantil: "",
    password: "",
    confirmPassword: "",
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

    // Validaciones básicas antes de llamar a la API
    if (
      !formData.nombre ||
      !formData.apellido ||
      !formData.email ||
      !formData.codigo_estudiantil ||
      !formData.password
    ) {
      setError("Por favor completa todos los campos obligatorios");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(`${API_URL}/auth/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          password: formData.password,
          tipo_usuario: "estudiante",
          codigo_estudiantil: formData.codigo_estudiantil,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        // El backend responde con { error: "..." } cuando algo falla
        setError(datos.error || "Ocurrió un error al crear la cuenta");
        return;
      }

      // Registro exitoso: guardamos el token y el usuario
      localStorage.setItem("token", datos.token);
      localStorage.setItem("usuario", JSON.stringify(datos.usuario));

      navigate("/dashboard");
    } catch (err) {
      console.error("Error de conexión:", err);
      setError("No se pudo conectar con el servidor. Intenta más tarde.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
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
          <h1>Crear cuenta</h1>
          <p>Regístrate para acceder a la plataforma</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                name="nombre"
                placeholder="Tu nombre"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Apellido</label>
              <input
                type="text"
                name="apellido"
                placeholder="Tu apellido"
                value={formData.apellido}
                onChange={handleChange}
              />
            </div>
          </div>

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
            <label>Código estudiantil</label>
            <input
              type="text"
              name="codigo_estudiantil"
              placeholder="Ej: 2024001"
              value={formData.codigo_estudiantil}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Número de teléfono</label>
            <input
              type="tel"
              name="telefono"
              placeholder="300 000 0000"
              value={formData.telefono}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="Crea una contraseña segura"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="auth-button" disabled={cargando}>
            <UserPlus size={19} />
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div className="auth-divider">
          <span>¿Ya tienes una cuenta?</span>
        </div>

        <button className="register-link" onClick={() => navigate("/login")}>
          Iniciar sesión
        </button>

        <button className="back-home" onClick={() => navigate("/")}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;

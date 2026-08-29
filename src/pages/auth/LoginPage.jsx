
import { Heart, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LoginPage() {

  const navigate = useNavigate();

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

          <h1>
            Bienvenido
          </h1>

          <p>
            Ingresa a tu cuenta para continuar
          </p>

        </div>

        <form>

          <div className="form-group">

            <label>
              Correo electrónico
            </label>

            <input
              type="email"
              placeholder="correo@universidad.edu.co"
            />

          </div>

          <div className="form-group">

            <label>
              Contraseña
            </label>

            <input
              type="password"
              placeholder="Ingresa tu contraseña"
            />

          </div>
          <div className="forgot-password">

            <button type="button">
              ¿Olvidaste tu contraseña?
            </button>

          </div>

          <button
            type="submit"
            className="auth-button"
          >
            <LogIn size={19} />

            Iniciar sesión

          </button>

        </form>


        <div className="auth-divider">
          <span>¿No tienes una cuenta?</span>
        </div>

        <button
          className="register-link"
          onClick={() => navigate("/register")}
        >
          Crear una cuenta
        </button>

        <button
          className="back-home"
          onClick={() => navigate("/")}
        >
          ← Volver al inicio
        </button>

      </div>

    </div>

  );
}

export default LoginPage;
import { Heart, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

function RegisterPage() {

  const navigate = useNavigate();

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

          <h1>
            Crear cuenta
          </h1>

          <p>
            Regístrate para acceder a la plataforma
          </p>

        </div>


        <form>

          <div className="form-row">

            <div className="form-group">

              <label>
                Nombre
              </label>

              <input
                type="text"
                placeholder="Tu nombre"
              />

            </div>


            <div className="form-group">

              <label>
                Apellido
              </label>

              <input
                type="text"
                placeholder="Tu apellido"
              />

            </div>

          </div>


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
              Número de teléfono
            </label>

            <input
              type="tel"
              placeholder="300 000 0000"
            />

          </div>


          <div className="form-group">

            <label>
              Contraseña
            </label>

            <input
              type="password"
              placeholder="Crea una contraseña segura"
            />

          </div>


          <div className="form-group">

            <label>
              Confirmar contraseña
            </label>

            <input
              type="password"
              placeholder="Repite tu contraseña"
            />

          </div>


          <button
            type="submit"
            className="auth-button"
          >

            <UserPlus size={19} />

            Crear cuenta

          </button>

        </form>


        <div className="auth-divider">
          <span>¿Ya tienes una cuenta?</span>
        </div>


        <button
          className="register-link"
          onClick={() => navigate("/login")}
        >
          Iniciar sesión
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

export default RegisterPage;
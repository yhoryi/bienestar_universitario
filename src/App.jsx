import { Routes, Route, useNavigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProfesionalDashboard from "./pages/professional/ProfesionalDashboard";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import {
  Heart,
  Brain,
  CalendarDays,
  BarChart3,
  ArrowRight
} from "lucide-react";
import "./index.css";

function HomePage() {

  const navigate = useNavigate();

  return (
    <div className="app">

      {/* NAVBAR */}

      <header className="navbar">

        <div className="logo-container">

          <div className="logo-icon">
            <Heart size={22} />
          </div>

          <div>
            <h2>Bienestar</h2>
            <span>Universitario</span>
          </div>

        </div>

        <button
          className="login-button"
          onClick={() => navigate("/login")}
        >
          Iniciar sesión
        </button>

      </header>


      {/* HERO */}

      <main className="hero">

        <section className="hero-content">

          <div className="welcome-tag">

            <Heart size={16} />

            <span>
              Tu bienestar importa
            </span>

          </div>


          <h1>

            Tu bienestar también es

            <span>
              {" "}parte de tu formación.
            </span>

          </h1>


          <p>

            Un espacio pensado para acompañarte,
            orientarte y conectarte con los servicios
            de Bienestar Universitario que pueden ayudarte.

          </p>


          <button
            className="primary-button"
            onClick={() => navigate("/login")}
          >

            Comenzar ahora

            <ArrowRight size={20} />

          </button>

        </section>


        {/* TARJETA */}

        <section className="hero-card-container">

          <div className="hero-card">

            <div className="card-header">

              <div className="card-icon">
                <Heart size={28} />
              </div>

              <div>

                <h3>
                  Estamos aquí para ti
                </h3>

                <p>
                  Un espacio para escucharte
                </p>

              </div>

            </div>


            <div className="wellbeing-circle">

              <div className="circle-content">

                <Heart size={38} />

                <strong>
                  Bienestar
                </strong>

                <span>
                  emocional y físico
                </span>

              </div>

            </div>


            <div className="card-message">

              <span>
                💙
              </span>

              <p>

                Cuida de ti, reconoce cómo te sientes
                y encuentra el apoyo que necesitas.

              </p>

            </div>

          </div>

        </section>

      </main>


      {/* FEATURES */}

      <section className="features">

        <div className="feature">

          <div className="feature-icon">
            <Brain size={25} />
          </div>

          <div>

            <h3>
              Orientación
            </h3>

            <p>
              Expresa cómo te sientes y recibe
              una orientación inicial.
            </p>

          </div>

        </div>


        <div className="feature">

          <div className="feature-icon">
            <CalendarDays size={25} />
          </div>

          <div>

            <h3>
              Citas
            </h3>

            <p>
              Accede y solicita citas con
              los servicios de bienestar.
            </p>

          </div>

        </div>


        <div className="feature">

          <div className="feature-icon">
            <BarChart3 size={25} />
          </div>

          <div>

            <h3>
              Seguimiento
            </h3>

            <p>
              Observa la evolución de tu bienestar
              a través del tiempo.
            </p>

          </div>

        </div>

      </section>


      {/* FOOTER */}

      <footer className="footer">

        <p>
          © 2026 Bienestar Universitario
        </p>

        <span>
          Tu bienestar también es parte de tu formación 💙
        </span>

      </footer>

    </div>
  );
}


function App() {

  return (

    <Routes>
<Route path="/recuperar-password" element={<ForgotPasswordPage />} />
<Route path="/restablecer-password" element={<ResetPasswordPage />} />
      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/dashboard"
        element={<StudentDashboard />}
      />

      <Route
        path="/admin"
        element={<AdminDashboard />}
      />

      <Route
        path="/profesional"
        element={<ProfesionalDashboard />}
      />

    </Routes>

  );

}


export default App;

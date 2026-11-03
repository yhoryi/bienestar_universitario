// Va en: src/components/profesional/PerfilProfesional.jsx
import { useEffect, useState } from "react";
import { api } from "../../services/http";

function PerfilProfesional() {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/profesional/perfil")
      .then(setPerfil)
      .catch((e) => setError(e.message));
  }, []);

  const datos = perfil
    ? [
        { etiqueta: "Servicio", valor: perfil.servicio },
        { etiqueta: "Especialidad", valor: perfil.especialidad || "No registrada" },
        { etiqueta: "Número de licencia", valor: perfil.numero_licencia || "No registrado" },
        { etiqueta: "Correo", valor: perfil.email },
      ]
    : [];

  return (
    <div className="modulo modulo-ancho">
      <header className="modulo-encabezado">
        <h1>Mi perfil</h1>
        <p>Tus datos como profesional de Bienestar Universitario.</p>
      </header>

      {error && <div className="auth-error">{error}</div>}

      {perfil && (
        <section className="tarjeta perfil-card">
          <div className="perfil-cabecera">
            <div className="avatar grande">{perfil.nombre?.[0]?.toUpperCase()}</div>
            <div>
              <h2>
                {perfil.nombre} {perfil.apellido}
              </h2>
              <span>Profesional · {perfil.servicio}</span>
            </div>
          </div>

          <dl className="perfil-datos">
            {datos.map((d) => (
              <div key={d.etiqueta}>
                <dt>{d.etiqueta}</dt>
                <dd>{d.valor}</dd>
              </div>
            ))}
          </dl>

          <p className="perfil-nota">
            Si necesitas corregir alguno de estos datos, comunícate con el administrador de la plataforma.
          </p>
        </section>
      )}
    </div>
  );
}

export default PerfilProfesional;

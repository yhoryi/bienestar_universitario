import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { api, cambiarActivo, useDatos } from "./adminApi";
import { Aviso, Vacio, Campo, CredencialesTemporales } from "./adminUi";

const FORM_VACIO = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  codigo_estudiantil: "",
  carrera: "",
  facultad: "",
  semestre: "",
  password: "",
};

function EstudiantesAdmin() {
  const [buscar, setBuscar] = useState("");
  const [consulta, setConsulta] = useState("");

  // Espera a que termine de escribir antes de consultar
  useEffect(() => {
    const t = setTimeout(() => setConsulta(buscar.trim()), 350);
    return () => clearTimeout(t);
  }, [buscar]);

  const lista = useDatos(`/estudiantes${consulta ? `?buscar=${encodeURIComponent(consulta)}` : ""}`);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [credenciales, setCredenciales] = useState(null);
  const [aviso, setAviso] = useState(null);

  const cambiar = (campo) => (e) => setForm((p) => ({ ...p, [campo]: e.target.value }));

  const crear = async (e) => {
    e.preventDefault();
    setError("");
    setAviso(null);
    setGuardando(true);
    try {
      const d = await api("/estudiantes", { metodo: "POST", cuerpo: form });
      setForm(FORM_VACIO);
      setMostrarForm(false);
      if (d.password_temporal) setCredenciales(d);
      else setAviso({ tipo: "ok", texto: "Estudiante creado correctamente." });
      await lista.recargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const alternarActivo = async (est) => {
    if (
      est.activo &&
      !window.confirm(`¿Desactivar a ${est.nombre} ${est.apellido}? No podrá iniciar sesión.`)
    ) {
      return;
    }
    setAviso(null);
    try {
      await cambiarActivo(est.usuario_id, !est.activo);
      await lista.recargar();
    } catch (err) {
      setAviso({ tipo: "error", texto: err.message });
    }
  };

  return (
    <div>
      <div className="ad-barra-herramientas">
        <input
          type="search"
          placeholder="Buscar por nombre, correo o código…"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
        <button type="button" className="ad-btn ad-btn-lleno" onClick={() => setMostrarForm((v) => !v)}>
          <Plus size={16} /> Nuevo estudiante
        </button>
      </div>

      <CredencialesTemporales datos={credenciales} onCerrar={() => setCredenciales(null)} />

      {mostrarForm && (
        <form className="ad-card ad-formulario" onSubmit={crear}>
          <div className="ad-formulario-cabecera">
            <h3>Nuevo estudiante</h3>
            <button type="button" className="ad-btn ad-btn-texto" onClick={() => setMostrarForm(false)}>
              <X size={16} /> Cerrar
            </button>
          </div>

          <div className="ad-campos">
            <Campo etiqueta="Nombre">
              <input value={form.nombre} onChange={cambiar("nombre")} />
            </Campo>
            <Campo etiqueta="Apellido">
              <input value={form.apellido} onChange={cambiar("apellido")} />
            </Campo>
            <Campo etiqueta="Correo">
              <input type="email" value={form.email} onChange={cambiar("email")} />
            </Campo>
            <Campo etiqueta="Teléfono (opcional)">
              <input type="tel" placeholder="300 000 0000" value={form.telefono} onChange={cambiar("telefono")} />
            </Campo>
            <Campo etiqueta="Código estudiantil">
              <input value={form.codigo_estudiantil} onChange={cambiar("codigo_estudiantil")} />
            </Campo>
            <Campo etiqueta="Carrera (opcional)">
              <input value={form.carrera} onChange={cambiar("carrera")} />
            </Campo>
            <Campo etiqueta="Facultad (opcional)">
              <input value={form.facultad} onChange={cambiar("facultad")} />
            </Campo>
            <Campo etiqueta="Semestre (opcional)">
              <input type="number" min="1" max="20" value={form.semestre} onChange={cambiar("semestre")} />
            </Campo>
          </div>

          <Campo etiqueta="Contraseña (opcional, mínimo 8 caracteres)">
            <input
              type="text"
              autoComplete="off"
              placeholder="Si la dejas vacía, el sistema genera una temporal"
              value={form.password}
              onChange={cambiar("password")}
            />
          </Campo>

          <Aviso>{error}</Aviso>
          <button type="submit" className="ad-btn ad-btn-lleno" disabled={guardando}>
            {guardando ? "Creando…" : "Crear estudiante"}
          </button>
        </form>
      )}

      <Aviso>{lista.error}</Aviso>
      {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}

      {!lista.datos && !lista.error && <Vacio>Cargando estudiantes…</Vacio>}
      {lista.datos && lista.datos.length === 0 && <Vacio>No se encontraron estudiantes.</Vacio>}

      {lista.datos && lista.datos.length > 0 && (
        <>
          <div className="ad-tabla-contenedor">
            <table className="ad-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Facultad</th>
                  <th>Carrera</th>
                  <th>Sem.</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.datos.map((x) => (
                  <tr key={x.estudiante_id} className={x.activo ? "" : "ad-fila-inactiva"}>
                    <td>
                      {x.nombre} {x.apellido}
                    </td>
                    <td>{x.codigo_estudiantil}</td>
                    <td>{x.email}</td>
                    <td>{x.telefono || "—"}</td>
                    <td>{x.facultad || "—"}</td>
                    <td>{x.carrera || "—"}</td>
                    <td>{x.semestre || "—"}</td>
                    <td>
                      <span className={`ad-estado ${x.activo ? "ad-estado-confirmada" : "ad-estado-cancelada"}`}>
                        {x.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`ad-btn ad-btn-chico ${x.activo ? "ad-btn-peligro" : ""}`}
                        onClick={() => alternarActivo(x)}
                      >
                        {x.activo ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lista.datos.length === 100 && (
            <p className="ad-nota">Se muestran los primeros 100 resultados. Usa el buscador para afinar.</p>
          )}
        </>
      )}
    </div>
  );
}

export default EstudiantesAdmin;

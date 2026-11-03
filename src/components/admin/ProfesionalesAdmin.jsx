import { useState } from "react";
import { Plus, X } from "lucide-react";
import { api, cambiarActivo, useDatos } from "./adminApi";
import { Aviso, Vacio, Campo, CredencialesTemporales } from "./adminUi";

const FORM_VACIO = {
  nombre: "",
  apellido: "",
  email: "",
  servicio_id: "",
  numero_licencia: "",
  especialidad: "",
  password: "",
};

function ProfesionalesAdmin() {
  const lista = useDatos("/profesionales");
  const servicios = useDatos("/servicios");

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
      const d = await api("/profesionales", {
        metodo: "POST",
        cuerpo: { ...form, servicio_id: form.servicio_id ? Number(form.servicio_id) : "" },
      });
      setForm(FORM_VACIO);
      setMostrarForm(false);
      if (d.password_temporal) setCredenciales(d);
      else setAviso({ tipo: "ok", texto: "Profesional creado correctamente." });
      await lista.recargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const alternarActivo = async (p) => {
    if (
      p.activo &&
      !window.confirm(
        `¿Desactivar a ${p.nombre} ${p.apellido}? No podrá iniciar sesión ni recibir nuevas citas.`
      )
    ) {
      return;
    }
    setAviso(null);
    try {
      await cambiarActivo(p.usuario_id, !p.activo);
      await lista.recargar();
    } catch (err) {
      setAviso({ tipo: "error", texto: err.message });
    }
  };

  return (
    <div>
      <div className="ad-barra-herramientas">
        <span className="ad-nota">Profesionales de psicología y atención médica.</span>
        <button type="button" className="ad-btn ad-btn-lleno" onClick={() => setMostrarForm((v) => !v)}>
          <Plus size={16} /> Nuevo profesional
        </button>
      </div>

      <CredencialesTemporales datos={credenciales} onCerrar={() => setCredenciales(null)} />

      {mostrarForm && (
        <form className="ad-card ad-formulario" onSubmit={crear}>
          <div className="ad-formulario-cabecera">
            <h3>Nuevo profesional</h3>
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
            <Campo etiqueta="Servicio">
              <select value={form.servicio_id} onChange={cambiar("servicio_id")}>
                <option value="">Selecciona…</option>
                {(servicios.datos || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Especialidad (opcional)">
              <input value={form.especialidad} onChange={cambiar("especialidad")} />
            </Campo>
            <Campo etiqueta="N.º de licencia (opcional)">
              <input value={form.numero_licencia} onChange={cambiar("numero_licencia")} />
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
            {guardando ? "Creando…" : "Crear profesional"}
          </button>
        </form>
      )}

      <Aviso>{lista.error}</Aviso>
      {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}

      {!lista.datos && !lista.error && <Vacio>Cargando profesionales…</Vacio>}
      {lista.datos && lista.datos.length === 0 && <Vacio>Aún no hay profesionales registrados.</Vacio>}

      {lista.datos && lista.datos.length > 0 && (
        <div className="ad-tabla-contenedor">
          <table className="ad-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Servicio</th>
                <th>Especialidad</th>
                <th>Horarios</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.datos.map((p) => (
                <tr key={p.profesional_id} className={p.activo ? "" : "ad-fila-inactiva"}>
                  <td>
                    {p.nombre} {p.apellido}
                  </td>
                  <td>{p.email}</td>
                  <td>{p.servicio}</td>
                  <td>{p.especialidad || "—"}</td>
                  <td>
                    {p.franjas > 0 ? (
                      `${p.franjas} franja${p.franjas === 1 ? "" : "s"}`
                    ) : (
                      <span className="ad-etiqueta-aviso">Sin horarios</span>
                    )}
                  </td>
                  <td>
                    <span className={`ad-estado ${p.activo ? "ad-estado-confirmada" : "ad-estado-cancelada"}`}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`ad-btn ad-btn-chico ${p.activo ? "ad-btn-peligro" : ""}`}
                      onClick={() => alternarActivo(p)}
                    >
                      {p.activo ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProfesionalesAdmin;

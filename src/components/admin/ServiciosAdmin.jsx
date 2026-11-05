// Va en: src/components/admin/ServiciosAdmin.jsx  (reemplaza el actual: es el tuyo + botón Eliminar)
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { api, useDatos } from "./adminApi";
import { Aviso, Vacio, Campo } from "./adminUi";

function ServiciosAdmin() {
  const { datos, error, recargar } = useDatos("/servicios");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "" });
  const [editando, setEditando] = useState(null); // { id, nombre, descripcion }
  const [errorForm, setErrorForm] = useState("");
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const crear = async (e) => {
    e.preventDefault();
    setErrorForm("");
    setAviso(null);
    setGuardando(true);
    try {
      await api("/servicios", { metodo: "POST", cuerpo: nuevo });
      setNuevo({ nombre: "", descripcion: "" });
      setMostrarForm(false);
      setAviso({ tipo: "ok", texto: "Servicio creado correctamente." });
      await recargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const guardarEdicion = async () => {
    setAviso(null);
    setGuardando(true);
    try {
      await api(`/servicios/${editando.id}`, {
        metodo: "PUT",
        cuerpo: { nombre: editando.nombre, descripcion: editando.descripcion },
      });
      setEditando(null);
      setAviso({ tipo: "ok", texto: "Servicio actualizado." });
      await recargar();
    } catch (err) {
      setAviso({ tipo: "error", texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  // DELETE: el backend responde 409 si el servicio tiene profesionales o citas
  const eliminar = async (s) => {
    if (!window.confirm(`¿Eliminar el servicio "${s.nombre}"? Esta acción no se puede deshacer.`)) return;
    setAviso(null);
    try {
      await api(`/servicios/${s.id}`, { metodo: "DELETE" });
      setAviso({ tipo: "ok", texto: `Servicio "${s.nombre}" eliminado.` });
      await recargar();
    } catch (err) {
      setAviso({ tipo: "error", texto: err.message });
    }
  };

  return (
    <div>
      <div className="ad-barra-herramientas">
        <span className="ad-nota">
          Servicios que ofrece Bienestar Universitario. Solo se puede eliminar uno sin profesionales ni citas.
        </span>
        <button type="button" className="ad-btn ad-btn-lleno" onClick={() => setMostrarForm((v) => !v)}>
          <Plus size={16} /> Nuevo servicio
        </button>
      </div>

      {mostrarForm && (
        <form className="ad-card ad-formulario" onSubmit={crear}>
          <div className="ad-formulario-cabecera">
            <h3>Nuevo servicio</h3>
            <button type="button" className="ad-btn ad-btn-texto" onClick={() => setMostrarForm(false)}>
              <X size={16} /> Cerrar
            </button>
          </div>
          <Campo etiqueta="Nombre">
            <input value={nuevo.nombre} onChange={(e) => setNuevo((p) => ({ ...p, nombre: e.target.value }))} />
          </Campo>
          <Campo etiqueta="Descripción (opcional)">
            <input
              value={nuevo.descripcion}
              onChange={(e) => setNuevo((p) => ({ ...p, descripcion: e.target.value }))}
            />
          </Campo>
          <Aviso>{errorForm}</Aviso>
          <button type="submit" className="ad-btn ad-btn-lleno" disabled={guardando}>
            {guardando ? "Creando…" : "Crear servicio"}
          </button>
        </form>
      )}

      <Aviso>{error}</Aviso>
      {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}

      {!datos && !error && <Vacio>Cargando servicios…</Vacio>}
      {datos && datos.length === 0 && <Vacio>Aún no hay servicios registrados.</Vacio>}

      {datos && datos.length > 0 && (
        <div className="ad-tabla-contenedor">
          <table className="ad-tabla">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Descripción</th>
                <th>Profesionales</th>
                <th>Citas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((s) =>
                editando && editando.id === s.id ? (
                  <tr key={s.id}>
                    <td>
                      <input
                        value={editando.nombre}
                        onChange={(e) => setEditando((p) => ({ ...p, nombre: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        value={editando.descripcion}
                        onChange={(e) => setEditando((p) => ({ ...p, descripcion: e.target.value }))}
                      />
                    </td>
                    <td>{s.profesionales}</td>
                    <td>{s.citas}</td>
                    <td>
                      <div className="ad-acciones">
                        <button
                          type="button"
                          className="ad-btn ad-btn-chico ad-btn-lleno"
                          disabled={guardando}
                          onClick={guardarEdicion}
                        >
                          Guardar
                        </button>
                        <button type="button" className="ad-btn ad-btn-chico" onClick={() => setEditando(null)}>
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.nombre}</strong>
                    </td>
                    <td className="ad-celda-motivo">{s.descripcion || "—"}</td>
                    <td>{s.profesionales}</td>
                    <td>{s.citas}</td>
                    <td>
                      <div className="ad-acciones">
                        <button
                          type="button"
                          className="ad-btn ad-btn-chico"
                          onClick={() =>
                            setEditando({ id: s.id, nombre: s.nombre, descripcion: s.descripcion || "" })
                          }
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="ad-btn ad-btn-chico"
                          disabled={s.profesionales > 0 || s.citas > 0}
                          title={
                            s.profesionales > 0 || s.citas > 0
                              ? "Tiene profesionales o citas asociados"
                              : "Eliminar servicio"
                          }
                          onClick={() => eliminar(s)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ServiciosAdmin;

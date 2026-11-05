import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { api, useDatos, hoy, formatearFecha, ETIQUETAS_ESTADO } from "./adminApi";
import { Aviso, Vacio, Campo } from "./adminUi";

// Mismas transiciones que valida el backend
const ACCIONES = {
  pendiente: [
    { estado: "confirmada", texto: "Confirmar" },
    { estado: "cancelada", texto: "Cancelar", peligro: true },
  ],
  confirmada: [
    { estado: "realizada", texto: "Marcar realizada" },
    { estado: "cancelada", texto: "Cancelar", peligro: true },
  ],
};

function FormularioCita({ onCreada, onCerrar }) {
  const estudiantes = useDatos("/estudiantes");
  const profesionales = useDatos("/profesionales");

  const [form, setForm] = useState({
    estudiante_id: "",
    profesional_id: "",
    fecha: "",
    hora: "",
    motivo: "",
  });
  const [horarios, setHorarios] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
      // si cambia el profesional o la fecha, la hora elegida deja de ser válida
      ...(campo === "profesional_id" || campo === "fecha" ? { hora: "" } : {}),
    }));
  };

  useEffect(() => {
    if (!form.profesional_id || !form.fecha) {
      setHorarios([]);
      return undefined;
    }
    let vigente = true;
    setCargandoHorarios(true);
    api(`/horarios?profesional_id=${form.profesional_id}&fecha=${form.fecha}`)
      .then((h) => vigente && setHorarios(h))
      .catch(() => vigente && setHorarios([]))
      .finally(() => vigente && setCargandoHorarios(false));
    return () => {
      vigente = false;
    };
  }, [form.profesional_id, form.fecha]);

  const enviar = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.estudiante_id || !form.profesional_id || !form.fecha || !form.hora) {
      setError("Elige estudiante, profesional, fecha y hora.");
      return;
    }

    setGuardando(true);
    try {
      await api("/citas", {
        metodo: "POST",
        cuerpo: {
          estudiante_id: Number(form.estudiante_id),
          profesional_id: Number(form.profesional_id),
          fecha: form.fecha,
          hora: form.hora,
          motivo: form.motivo,
        },
      });
      onCreada();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const listaEstudiantes = (estudiantes.datos || []).filter((x) => x.activo);
  const listaProfesionales = (profesionales.datos || []).filter((x) => x.activo);

  return (
    <form className="ad-card ad-formulario" onSubmit={enviar}>
      <div className="ad-formulario-cabecera">
        <h3>Programar una cita</h3>
        <button type="button" className="ad-btn ad-btn-texto" onClick={onCerrar}>
          <X size={16} /> Cerrar
        </button>
      </div>
      <p className="ad-nota">La cita queda confirmada y se notifica al estudiante y al profesional.</p>

      <Aviso>{estudiantes.error || profesionales.error}</Aviso>

      <div className="ad-campos">
        <Campo etiqueta="Estudiante">
          <select value={form.estudiante_id} onChange={(e) => cambiar("estudiante_id", e.target.value)}>
            <option value="">Selecciona…</option>
            {listaEstudiantes.map((x) => (
              <option key={x.estudiante_id} value={x.estudiante_id}>
                {x.apellido} {x.nombre} — {x.codigo_estudiantil}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Profesional">
          <select value={form.profesional_id} onChange={(e) => cambiar("profesional_id", e.target.value)}>
            <option value="">Selecciona…</option>
            {listaProfesionales.map((x) => (
              <option key={x.profesional_id} value={x.profesional_id}>
                {x.nombre} {x.apellido} — {x.servicio}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Fecha">
          <input type="date" min={hoy()} value={form.fecha} onChange={(e) => cambiar("fecha", e.target.value)} />
        </Campo>

        <Campo etiqueta="Hora disponible">
          <select
            value={form.hora}
            onChange={(e) => cambiar("hora", e.target.value)}
            disabled={!form.profesional_id || !form.fecha || cargandoHorarios}
          >
            <option value="">
              {cargandoHorarios
                ? "Buscando horarios…"
                : form.profesional_id && form.fecha && horarios.length === 0
                ? "Sin horarios libres ese día"
                : "Selecciona…"}
            </option>
            {horarios.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo etiqueta="Motivo (opcional)">
        <input
          type="text"
          maxLength={200}
          value={form.motivo}
          onChange={(e) => cambiar("motivo", e.target.value)}
        />
      </Campo>

      <Aviso>{error}</Aviso>

      <button type="submit" className="ad-btn ad-btn-lleno" disabled={guardando}>
        {guardando ? "Programando…" : "Programar cita"}
      </button>
    </form>
  );
}

function CitasAdmin() {
  const { datos, error, recargar } = useDatos("/citas");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroServicio, setFiltroServicio] = useState("");
  const [buscar, setBuscar] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [ocupada, setOcupada] = useState(null);
  const [aviso, setAviso] = useState(null);

  const servicios = useMemo(
    () => [...new Set((datos || []).map((c) => c.servicio))].sort(),
    [datos]
  );

  const filtradas = useMemo(() => {
    const texto = buscar.trim().toLowerCase();
    return (datos || []).filter((c) => {
      if (filtroEstado && c.estado !== filtroEstado) return false;
      if (filtroServicio && c.servicio !== filtroServicio) return false;
      if (!texto) return true;
      const nombres = `${c.estudiante_nombre} ${c.estudiante_apellido} ${c.profesional_nombre} ${c.profesional_apellido}`;
      return nombres.toLowerCase().includes(texto);
    });
  }, [datos, filtroEstado, filtroServicio, buscar]);

  const cambiarEstado = async (cita, estado) => {
    if (
      estado === "cancelada" &&
      !window.confirm("¿Cancelar esta cita? Se notificará al estudiante y al profesional.")
    ) {
      return;
    }
    setOcupada(cita.id);
    setAviso(null);
    try {
      await api(`/citas/${cita.id}/estado`, { metodo: "PATCH", cuerpo: { estado } });
      await recargar();
    } catch (e) {
      setAviso({ tipo: "error", texto: e.message });
    } finally {
      setOcupada(null);
    }
  };

  // DELETE: borra la cita definitivamente (los demás botones solo cambian su estado)
  const eliminar = async (cita) => {
    if (!window.confirm("¿Eliminar esta cita definitivamente? Esta acción no se puede deshacer.")) return;
    setOcupada(cita.id);
    setAviso(null);
    try {
      await api(`/citas/${cita.id}`, { metodo: "DELETE" });
      setAviso({ tipo: "ok", texto: "Cita eliminada." });
      await recargar();
    } catch (e) {
      setAviso({ tipo: "error", texto: e.message });
    } finally {
      setOcupada(null);
    }
  };

  const alCrear = async () => {
    setMostrarForm(false);
    setAviso({ tipo: "ok", texto: "Cita programada correctamente." });
    await recargar();
  };

  return (
    <div>
      <div className="ad-barra-herramientas">
        <input
          type="search"
          placeholder="Buscar por estudiante o profesional…"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ETIQUETAS_ESTADO).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
        <select value={filtroServicio} onChange={(e) => setFiltroServicio(e.target.value)}>
          <option value="">Todos los servicios</option>
          {servicios.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="button" className="ad-btn ad-btn-lleno" onClick={() => setMostrarForm((v) => !v)}>
          <Plus size={16} /> Programar cita
        </button>
      </div>

      {mostrarForm && <FormularioCita onCreada={alCrear} onCerrar={() => setMostrarForm(false)} />}

      <Aviso>{error}</Aviso>
      {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}

      {!datos && !error && <Vacio>Cargando citas…</Vacio>}
      {datos && filtradas.length === 0 && <Vacio>No hay citas que coincidan con los filtros.</Vacio>}

      {filtradas.length > 0 && (
        <div className="ad-tabla-contenedor">
          <table className="ad-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estudiante</th>
                <th>Profesional</th>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Motivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => (
                <tr key={c.id}>
                  <td>{formatearFecha(c.fecha)}</td>
                  <td>{c.hora}</td>
                  <td>
                    {c.estudiante_nombre} {c.estudiante_apellido}
                  </td>
                  <td>
                    {c.profesional_nombre} {c.profesional_apellido}
                  </td>
                  <td>{c.servicio}</td>
                  <td>
                    <span className={`ad-estado ad-estado-${c.estado}`}>
                      {ETIQUETAS_ESTADO[c.estado] || c.estado}
                    </span>
                  </td>
                  <td className="ad-celda-motivo">{c.motivo || "—"}</td>
                  <td>
                    <div className="ad-acciones">
                      {(ACCIONES[c.estado] || []).map((a) => (
                        <button
                          key={a.estado}
                          type="button"
                          className={`ad-btn ad-btn-chico ${a.peligro ? "ad-btn-peligro" : ""}`}
                          disabled={ocupada === c.id}
                          onClick={() => cambiarEstado(c, a.estado)}
                        >
                          {a.texto}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="ad-btn ad-btn-chico ad-btn-peligro"
                        disabled={ocupada === c.id}
                        onClick={() => eliminar(c)}
                      >
                        Eliminar
                      </button>
                    </div>
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

export default CitasAdmin;

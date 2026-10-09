// Va en: src/components/CitasEstudiante.jsx
import { useEffect, useState } from "react";
import { CalendarDays, XCircle } from "lucide-react";
import { api, formatearFecha, ETIQUETAS_ESTADO } from "../services/citasApi";

const hoy = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

function CitasEstudiante() {
  const [servicios, setServicios] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [citas, setCitas] = useState([]);

  const [form, setForm] = useState({
    servicio_id: "",
    profesional_id: "",
    fecha: "",
    hora: "",
    motivo: "",
  });

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargarCitas = () =>
    api("/mias")
      .then(setCitas)
      .catch((e) => setError(e.message));

  // Al abrir: servicios y mis citas
  useEffect(() => {
    api("/servicios").then(setServicios).catch((e) => setError(e.message));
    cargarCitas();
  }, []);

  // Al elegir servicio: profesionales de ese servicio
  useEffect(() => {
    setProfesionales([]);
    if (!form.servicio_id) return;
    api(`/profesionales?servicio_id=${form.servicio_id}`)
      .then(setProfesionales)
      .catch((e) => setError(e.message));
  }, [form.servicio_id]);

  // Al elegir profesional y fecha: horas libres
  useEffect(() => {
    setHorarios([]);
    if (!form.profesional_id || !form.fecha) return;
    api(`/horarios?profesional_id=${form.profesional_id}&fecha=${form.fecha}`)
      .then(setHorarios)
      .catch((e) => setError(e.message));
  }, [form.profesional_id, form.fecha]);

  const cambiar = (campo, valor) => {
    setError("");
    setExito("");
    setForm((prev) => {
      const nuevo = { ...prev, [campo]: valor };
      // Al cambiar algo anterior, se reinicia lo que dependía de eso
      if (campo === "servicio_id") {
        nuevo.profesional_id = "";
        nuevo.hora = "";
      }
      if (campo === "profesional_id" || campo === "fecha") nuevo.hora = "";
      return nuevo;
    });
  };

  const solicitar = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    if (!form.profesional_id || !form.fecha || !form.hora) {
      setError("Elige el profesional, el día y la hora");
      return;
    }

    setCargando(true);
    try {
      await api("/", {
        method: "POST",
        body: {
          profesional_id: Number(form.profesional_id),
          fecha: form.fecha,
          hora: form.hora,
          motivo: form.motivo.trim(),
        },
      });
      setExito("¡Cita solicitada! El profesional la revisará y te avisaremos.");
      setForm({ servicio_id: "", profesional_id: "", fecha: "", hora: "", motivo: "" });
      cargarCitas();
    } catch (err) {
      setError(err.message);
      // Si el horario se ocupó mientras elegías, se refresca la lista
      if (form.profesional_id && form.fecha) {
        api(`/horarios?profesional_id=${form.profesional_id}&fecha=${form.fecha}`)
          .then(setHorarios)
          .catch(() => {});
      }
    } finally {
      setCargando(false);
    }
  };

  const cancelar = async (id) => {
    if (!window.confirm("¿Seguro que quieres cancelar esta cita?")) return;
    setError("");
    setExito("");
    try {
      await api(`/${id}/cancelar`, { method: "PATCH" });
      cargarCitas();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="citas-wrap">
      {error && <div className="auth-error">{error}</div>}
      {exito && <div className="auth-info">{exito}</div>}

      <section className="citas-panel">
        <h2>
          <CalendarDays size={20} /> Solicitar una cita
        </h2>

        <form onSubmit={solicitar}>
          <div className="form-group">
            <label>Servicio</label>
            <select value={form.servicio_id} onChange={(e) => cambiar("servicio_id", e.target.value)}>
              <option value="">Selecciona un servicio</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Profesional</label>
            <select
              value={form.profesional_id}
              onChange={(e) => cambiar("profesional_id", e.target.value)}
              disabled={!form.servicio_id}
            >
              <option value="">
                {form.servicio_id && profesionales.length === 0
                  ? "No hay profesionales para este servicio"
                  : "Selecciona un profesional"}
              </option>
              {profesionales.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido}
                  {p.especialidad ? ` · ${p.especialidad}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Día</label>
            <input
              type="date"
              min={hoy()}
              value={form.fecha}
              onChange={(e) => cambiar("fecha", e.target.value)}
              disabled={!form.profesional_id}
            />
          </div>

          {form.profesional_id && form.fecha && (
            <div className="form-group">
              <label>Hora disponible</label>
              {horarios.length === 0 ? (
                <p className="citas-vacio">No hay horarios libres ese día. Prueba con otra fecha.</p>
              ) : (
                <div className="slots">
                  {horarios.map((h) => (
                    <button
                      type="button"
                      key={h}
                      className={`slot ${form.hora === h ? "activo" : ""}`}
                      onClick={() => cambiar("hora", h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Motivo (opcional)</label>
            <textarea
              rows={3}
              placeholder="Cuéntanos brevemente para qué necesitas la cita"
              value={form.motivo}
              onChange={(e) => cambiar("motivo", e.target.value)}
            />
          </div>

          <button type="submit" className="auth-button" disabled={cargando}>
            {cargando ? "Solicitando..." : "Solicitar cita"}
          </button>
        </form>
      </section>

      <section className="citas-panel">
        <h2>Mis citas</h2>

        {citas.length === 0 ? (
          <p className="citas-vacio">Aún no tienes citas.</p>
        ) : (
          <div className="citas-lista">
            {citas.map((c) => (
              <div className="cita-item" key={c.id}>
                <div className="cita-info">
                  <strong>
                    {formatearFecha(c.fecha)} · {c.hora}
                  </strong>
                  <span>
                    {c.servicio} con {c.profesional_nombre} {c.profesional_apellido}
                  </span>
                  {c.motivo && <small>{c.motivo}</small>}
                </div>

                <div className="cita-acciones">
                  <span className={`estado-badge estado-${c.estado}`}>
                    {ETIQUETAS_ESTADO[c.estado] || c.estado}
                  </span>
                  {(c.estado === "pendiente" || c.estado === "confirmada") && (
                    <button className="btn-cita btn-peligro" onClick={() => cancelar(c.id)}>
                      <XCircle size={15} /> Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default CitasEstudiante;

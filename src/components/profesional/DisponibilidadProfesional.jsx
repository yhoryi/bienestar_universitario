// Va en: src/components/profesional/DisponibilidadProfesional.jsx
import { useEffect, useState } from "react";
import { Plus, Trash2, Info } from "lucide-react";
import { api } from "../../services/http";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function DisponibilidadProfesional() {
  const [franjas, setFranjas] = useState([]);
  const [form, setForm] = useState({ dia_semana: "Lunes", hora_inicio: "08:00", hora_fin: "12:00" });
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargar = () =>
    api("/profesional/disponibilidad")
      .then(setFranjas)
      .catch((e) => setError(e.message));

  useEffect(() => {
    cargar();
  }, []);

  const cambiar = (campo, valor) => {
    setError("");
    setExito("");
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const agregar = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    setCargando(true);
    try {
      await api("/profesional/disponibilidad", { method: "POST", body: form });
      setExito("Franja agregada. Los estudiantes ya pueden ver esas horas.");
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta franja? Las citas que ya estén agendadas no se cancelan.")) return;
    setError("");
    setExito("");
    try {
      await api(`/profesional/disponibilidad/${id}`, { method: "DELETE" });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modulo modulo-ancho">
      <header className="modulo-encabezado">
        <h1>Mi disponibilidad</h1>
        <p>Define los días y horarios en que atiendes. Los estudiantes solo podrán pedir cita dentro de estas franjas.</p>
      </header>

      <div className="chat-aviso">
        <Info size={16} />
        <span>
          Cada cita dura 60 minutos, así que una franja de 8:00 a 12:00 ofrece 4 citas. Quitar una franja no
          cancela las citas ya agendadas en ella.
        </span>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {exito && <div className="auth-info">{exito}</div>}

      <section className="tarjeta">
        <h2>Agregar una franja</h2>
        <form onSubmit={agregar} className="form-franja">
          <div className="form-group">
            <label>Día</label>
            <select value={form.dia_semana} onChange={(e) => cambiar("dia_semana", e.target.value)}>
              {DIAS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Desde</label>
            <input type="time" value={form.hora_inicio} onChange={(e) => cambiar("hora_inicio", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Hasta</label>
            <input type="time" value={form.hora_fin} onChange={(e) => cambiar("hora_fin", e.target.value)} />
          </div>
          <button type="submit" className="auth-button boton-franja" disabled={cargando}>
            <Plus size={18} />
            {cargando ? "Guardando..." : "Agregar"}
          </button>
        </form>
      </section>

      <section className="tarjeta">
        <h2>Mi horario semanal</h2>
        <div className="semana">
          {DIAS.map((dia) => {
            const delDia = franjas.filter((f) => f.dia_semana === dia);
            return (
              <div className="dia-fila" key={dia}>
                <div className="dia-nombre">{dia}</div>
                <div className="dia-franjas">
                  {delDia.length === 0 ? (
                    <span className="sin-franja">Sin atención</span>
                  ) : (
                    delDia.map((f) => (
                      <span className="franja" key={f.id}>
                        {f.hora_inicio} – {f.hora_fin}
                        <button onClick={() => eliminar(f.id)} title="Eliminar franja" aria-label="Eliminar franja">
                          <Trash2 size={14} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default DisponibilidadProfesional;

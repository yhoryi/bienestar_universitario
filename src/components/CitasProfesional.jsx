// Va en: src/components/CitasProfesional.jsx
import { useEffect, useState } from "react";
import { Check, X, CheckCheck } from "lucide-react";
import { api, formatearFecha, ETIQUETAS_ESTADO } from "../services/citasApi";

const FILTROS = [
  { valor: "pendiente", texto: "Pendientes" },
  { valor: "confirmada", texto: "Confirmadas" },
  { valor: "realizada", texto: "Realizadas" },
  { valor: "cancelada", texto: "Canceladas" },
  { valor: "todas", texto: "Todas" },
];

function CitasProfesional({ onCambio }) {
  const [citas, setCitas] = useState([]);
  const [filtro, setFiltro] = useState("pendiente");
  const [error, setError] = useState("");

  const cargar = () =>
    api("/profesional")
      .then(setCitas)
      .catch((e) => setError(e.message));

  useEffect(() => {
    cargar();
  }, []);

  const cambiarEstado = async (id, estado) => {
    setError("");
    try {
      await api(`/${id}/estado`, { method: "PATCH", body: { estado } });
      cargar();
      onCambio?.(); // avisa al panel para actualizar los contadores
    } catch (err) {
      setError(err.message);
    }
  };

  const visibles = filtro === "todas" ? citas : citas.filter((c) => c.estado === filtro);
  const pendientes = citas.filter((c) => c.estado === "pendiente").length;

  return (
    <div className="citas-wrap">
      {error && <div className="auth-error">{error}</div>}

      <section className="citas-panel">
        <h2>
          Citas
          {pendientes > 0 && <span className="contador">{pendientes} por revisar</span>}
        </h2>

        <div className="filtros">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              className={`filtro ${filtro === f.valor ? "activo" : ""}`}
              onClick={() => setFiltro(f.valor)}
            >
              {f.texto}
            </button>
          ))}
        </div>

        {visibles.length === 0 ? (
          <p className="citas-vacio">No hay citas en esta categoría.</p>
        ) : (
          <div className="citas-lista">
            {visibles.map((c) => (
              <div className="cita-item" key={c.id}>
                <div className="cita-info">
                  <strong>
                    {formatearFecha(c.fecha)} · {c.hora}
                  </strong>
                  <span>
                    {c.estudiante_nombre} {c.estudiante_apellido}
                    {c.estudiante_carrera ? ` · ${c.estudiante_carrera}` : ""}
                  </span>
                  <small>
                    {c.servicio}
                    {c.motivo ? ` — ${c.motivo}` : ""}
                  </small>
                </div>

                <div className="cita-acciones">
                  <span className={`estado-badge estado-${c.estado}`}>
                    {ETIQUETAS_ESTADO[c.estado] || c.estado}
                  </span>

                  {c.estado === "pendiente" && (
                    <>
                      <button className="btn-cita btn-ok" onClick={() => cambiarEstado(c.id, "confirmada")}>
                        <Check size={15} /> Confirmar
                      </button>
                      <button className="btn-cita btn-peligro" onClick={() => cambiarEstado(c.id, "cancelada")}>
                        <X size={15} /> Rechazar
                      </button>
                    </>
                  )}

                  {c.estado === "confirmada" && (
                    <>
                      <button className="btn-cita btn-ok" onClick={() => cambiarEstado(c.id, "realizada")}>
                        <CheckCheck size={15} /> Marcar realizada
                      </button>
                      <button className="btn-cita btn-peligro" onClick={() => cambiarEstado(c.id, "cancelada")}>
                        <X size={15} /> Cancelar
                      </button>
                    </>
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

export default CitasProfesional;

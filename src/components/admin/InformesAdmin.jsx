// Va en: src/components/admin/InformesAdmin.jsx  (archivo nuevo)
import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api, ETIQUETAS_ESTADO } from "./adminApi";
import { Aviso, Vacio } from "./adminUi";
import "./InformesAdmin.css";

const aTexto = (d) => d.toLocaleDateString("en-CA"); // AAAA-MM-DD
const haceDias = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  return aTexto(d);
};

// Barras horizontales: [{ etiqueta, total }]
function Barras({ datos }) {
  if (!datos.length) return <p className="ad-nota">Sin datos en este rango.</p>;
  const max = Math.max(...datos.map((d) => d.total), 1);
  return (
    <div className="inf-barras">
      {datos.map((d) => (
        <div className="inf-barra-fila" key={d.etiqueta}>
          <span className="inf-barra-etiqueta">{d.etiqueta}</span>
          <div className="inf-barra-pista">
            <div className="inf-barra-relleno" style={{ width: `${(d.total / max) * 100}%` }} />
          </div>
          <b>{d.total}</b>
        </div>
      ))}
    </div>
  );
}

function InformesAdmin() {
  const [desde, setDesde] = useState(haceDias(30));
  const [hasta, setHasta] = useState(aTexto(new Date()));
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback((d, h) => {
    setCargando(true);
    setError("");
    api(`/informes?desde=${d}&hasta=${h}`)
      .then(setDatos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar(desde, hasta);
    // Solo al abrir: después se consulta con el botón o los atajos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atajo = (dias) => {
    const d = haceDias(dias);
    const h = aTexto(new Date());
    setDesde(d);
    setHasta(h);
    cargar(d, h);
  };

  const exportarCSV = () => {
    const cab = ["Profesional", "Servicio", "Total", "Pendientes", "Confirmadas", "Realizadas", "Canceladas", "Estudiantes atendidos"];
    const filas = datos.profesionales.map((p) => [
      p.profesional, p.servicio, p.total, p.pendientes, p.confirmadas, p.realizadas, p.canceladas, p.estudiantes_atendidos,
    ]);
    const csv = [cab, ...filas]
      .map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    enlace.download = `informe-profesionales_${datos.rango.desde}_${datos.rango.hasta}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  };

  const totalCitas = datos ? datos.citas_estado.reduce((s, c) => s + c.total, 0) : 0;
  const totalCheckins = datos ? datos.checkins_por_dia.reduce((s, c) => s + c.total, 0) : 0;

  return (
    <div>
      <div className="ad-card inf-filtros">
        <label>
          Desde
          <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <button type="button" className="ad-btn ad-btn-lleno" disabled={cargando} onClick={() => cargar(desde, hasta)}>
          {cargando ? "Generando…" : "Generar informe"}
        </button>
        <div className="ad-acciones">
          {[7, 30, 90].map((n) => (
            <button key={n} type="button" className="ad-btn ad-btn-chico" onClick={() => atajo(n)}>
              Últimos {n} días
            </button>
          ))}
        </div>
      </div>

      <Aviso>{error}</Aviso>
      {!datos && !error && <Vacio>Generando informe…</Vacio>}

      {datos && (
        <>
          <p className="ad-nota">
            Datos agregados del {datos.rango.desde} al {datos.rango.hasta} ({datos.rango.dias} días). No incluyen el
            contenido de los mensajes de los estudiantes.
          </p>

          <div className="inf-resumen">
            <div className="ad-card"><span>Check-ins</span><strong>{totalCheckins}</strong></div>
            <div className="ad-card"><span>Estrés promedio</span><strong>{datos.estres.promedio ?? "—"}</strong></div>
            <div className="ad-card"><span>Citas en el rango</span><strong>{totalCitas}</strong></div>
          </div>

          <div className="inf-rejilla">
            <section className="ad-card">
              <h3>Estado de ánimo</h3>
              <Barras datos={datos.animo.map((a) => ({ etiqueta: `${a.emoji || ""} ${a.nombre}`, total: a.total }))} />
            </section>
            <section className="ad-card">
              <h3>Factores más frecuentes</h3>
              <Barras datos={datos.factores.map((f) => ({ etiqueta: f.nombre, total: f.total }))} />
            </section>
            <section className="ad-card">
              <h3>Temas en la conversación con la IA</h3>
              <Barras datos={datos.categorias.map((c) => ({ etiqueta: c.categoria, total: c.total }))} />
            </section>
            <section className="ad-card">
              <h3>Citas por estado</h3>
              <Barras
                datos={datos.citas_estado.map((c) => ({ etiqueta: ETIQUETAS_ESTADO[c.estado] || c.estado, total: c.total }))}
              />
            </section>
            <section className="ad-card">
              <h3>Citas por servicio</h3>
              <Barras datos={datos.citas_servicio.map((c) => ({ etiqueta: c.nombre, total: c.total }))} />
            </section>
          </div>

          <section className="ad-card">
            <div className="inf-cabecera">
              <h3>Informe por profesional</h3>
              <button type="button" className="ad-btn ad-btn-chico" onClick={exportarCSV}>
                <Download size={15} /> Exportar CSV
              </button>
            </div>
            <div className="ad-tabla-contenedor">
              <table className="ad-tabla">
                <thead>
                  <tr>
                    <th>Profesional</th>
                    <th>Servicio</th>
                    <th>Total</th>
                    <th>Pendientes</th>
                    <th>Confirmadas</th>
                    <th>Realizadas</th>
                    <th>Canceladas</th>
                    <th>Estudiantes</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.profesionales.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.profesional}</strong></td>
                      <td>{p.servicio}</td>
                      <td><b>{p.total}</b></td>
                      <td>{p.pendientes}</td>
                      <td>{p.confirmadas}</td>
                      <td>{p.realizadas}</td>
                      <td>{p.canceladas}</td>
                      <td>{p.estudiantes_atendidos}</td>
                    </tr>
                  ))}
                  {datos.profesionales.length === 0 && (
                    <tr>
                      <td colSpan={8}>No hay profesionales registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default InformesAdmin;

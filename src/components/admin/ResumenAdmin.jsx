import {
  Users,
  Stethoscope,
  CalendarCheck,
  Clock,
  HeartPulse,
  MessageCircle,
  ShieldAlert,
} from "lucide-react";
import { useDatos, ETIQUETAS_ESTADO } from "./adminApi";
import { Aviso, Vacio } from "./adminUi";

const ETIQUETAS_CATEGORIA = {
  estres_academico: "Estrés académico",
  bienestar_emocional: "Bienestar emocional",
  sintoma_fisico: "Síntomas físicos",
  bienestar_general: "Bienestar general",
  situacion_de_riesgo: "Situación de riesgo",
  otro: "Otro",
};

const nombreCategoria = (c) => ETIQUETAS_CATEGORIA[c] || String(c).replace(/_/g, " ");

function Kpi({ icono: Icono, etiqueta, valor, alerta }) {
  return (
    <div className={`ad-kpi ${alerta ? "ad-kpi-alerta" : ""}`}>
      <div className="ad-kpi-icono">
        <Icono size={20} />
      </div>
      <div>
        <strong>{valor}</strong>
        <span>{etiqueta}</span>
      </div>
    </div>
  );
}

function Barras({ items, color = "" }) {
  const hayDatos = items.some((i) => i.valor > 0);
  if (!hayDatos) return <Vacio>Aún no hay datos en este periodo.</Vacio>;

  const max = Math.max(1, ...items.map((i) => i.valor));
  return (
    <ul className="ad-barras">
      {items.map((i) => (
        <li key={i.etiqueta}>
          <span className="ad-barra-etiqueta">{i.etiqueta}</span>
          <div className="ad-barra-pista">
            <div
              className={`ad-barra-relleno ${color}`}
              style={{ width: `${(i.valor / max) * 100}%` }}
            />
          </div>
          <span className="ad-barra-valor">{i.valor}</span>
        </li>
      ))}
    </ul>
  );
}

function ResumenAdmin() {
  const resumen = useDatos("/resumen");
  const stats = useDatos("/estadisticas");

  const r = resumen.datos;
  const s = stats.datos;

  return (
    <div>
      <Aviso>{resumen.error}</Aviso>

      {r && (
        <div className="ad-kpis">
          <Kpi icono={Users} etiqueta="Estudiantes activos" valor={r.estudiantes} />
          <Kpi icono={Stethoscope} etiqueta="Profesionales activos" valor={r.profesionales} />
          <Kpi icono={CalendarCheck} etiqueta="Citas para hoy" valor={r.citas_hoy} />
          <Kpi icono={Clock} etiqueta="Citas pendientes" valor={r.citas_pendientes} />
          <Kpi icono={HeartPulse} etiqueta="Check-ins (7 días)" valor={r.checkins_semana} />
          <Kpi icono={MessageCircle} etiqueta="Mensajes al asistente (7 días)" valor={r.mensajes_semana} />
          <Kpi
            icono={ShieldAlert}
            etiqueta="Alertas de riesgo sin atender"
            valor={r.alertas_sin_atender}
            alerta={r.alertas_sin_atender > 0}
          />
        </div>
      )}

      <h2 className="ad-subtitulo">Tendencias de los últimos 30 días</h2>
      <p className="ad-nota">
        Datos agregados y anónimos: aquí no se muestra ningún estudiante ni ningún mensaje individual.
      </p>

      <Aviso>{stats.error}</Aviso>

      {s && (
        <div className="ad-grid-2">
          <section className="ad-card">
            <h3>Estado de ánimo registrado</h3>
            <Barras
              items={s.animo.map((a) => ({ etiqueta: `${a.emoji} ${a.nombre}`, valor: a.total }))}
            />
          </section>

          <section className="ad-card">
            <h3>Nivel de estrés promedio</h3>
            <div className="ad-gran-numero">
              {s.estres.promedio ?? "—"}
              <small> / 5</small>
            </div>
            <p className="ad-nota">Calculado con {s.estres.registros} registros.</p>
          </section>

          <section className="ad-card">
            <h3>Factores más frecuentes</h3>
            <Barras
              color="ad-barra-morado"
              items={s.factores.map((f) => ({ etiqueta: f.nombre, valor: f.total }))}
            />
          </section>

          <section className="ad-card">
            <h3>Temas consultados al asistente</h3>
            <Barras
              color="ad-barra-verde"
              items={s.categorias.map((c) => ({ etiqueta: nombreCategoria(c.categoria), valor: c.total }))}
            />
          </section>

          <section className="ad-card">
            <h3>Citas por servicio</h3>
            <Barras items={s.citas_por_servicio.map((c) => ({ etiqueta: c.nombre, valor: c.total }))} />
          </section>

          <section className="ad-card">
            <h3>Citas por estado</h3>
            <Barras
              color="ad-barra-naranja"
              items={s.citas_por_estado.map((c) => ({
                etiqueta: ETIQUETAS_ESTADO[c.estado] || c.estado,
                valor: c.total,
              }))}
            />
          </section>
        </div>
      )}
    </div>
  );
}

export default ResumenAdmin;

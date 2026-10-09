// Va en: src/components/CheckinBienestar.jsx
import { useEffect, useState } from "react";
import { HeartHandshake } from "lucide-react";
import { api } from "../services/bienestarApi";

const ETIQUETAS_ESTRES = ["Muy bajo", "Bajo", "Medio", "Alto", "Muy alto"];

const FORM_VACIO = {
  estado_animo_id: null,
  nivel_estres: null,
  factores: [],
  comentario: "",
};

function CheckinBienestar({ onIrACitas }) {
  const [opciones, setOpciones] = useState({ estados: [], factores: [] });
  const [hoy, setHoy] = useState([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargarHoy = () =>
    api("/hoy")
      .then(setHoy)
      .catch((e) => setError(e.message));

  useEffect(() => {
    api("/opciones")
      .then(setOpciones)
      .catch((e) => setError(e.message));
    cargarHoy();
  }, []);

  const elegir = (campo, valor) => {
    setError("");
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const alternarFactor = (id) => {
    setError("");
    setForm((prev) => ({
      ...prev,
      factores: prev.factores.includes(id)
        ? prev.factores.filter((f) => f !== id)
        : [...prev.factores, id],
    }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.estado_animo_id) {
      setError("Elige cómo te sientes");
      return;
    }
    if (!form.nivel_estres) {
      setError("Indica tu nivel de estrés");
      return;
    }

    setCargando(true);
    try {
      const datos = await api("/registro", {
        method: "POST",
        body: {
          estado_animo_id: form.estado_animo_id,
          nivel_estres: form.nivel_estres,
          factores: form.factores,
          comentario: form.comentario.trim(),
        },
      });
      setResultado({ valor: datos.estado_valor, estres: datos.nivel_estres });
      setForm(FORM_VACIO);
      cargarHoy();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const necesitaApoyo = resultado && (resultado.valor <= 2 || resultado.estres >= 4);

  return (
    <div className="modulo">
      <header className="modulo-encabezado">
        <h1>¿Cómo te sientes hoy?</h1>
        <p>Tómate un momento para reconocer cómo estás. No hay respuestas buenas ni malas.</p>
      </header>

      {resultado && (
        <div className={`aviso-checkin ${necesitaApoyo ? "apoyo" : "bien"}`}>
          <HeartHandshake size={22} />
          <div>
            <strong>Gracias por registrarte.</strong>
            {necesitaApoyo ? (
              <>
                <p>
                  Parece que estás pasando por un momento difícil, y no tienes que
                  atravesarlo solo/a. Hablar con alguien del equipo de Bienestar puede ayudarte.
                </p>
                <button className="btn-apoyo" onClick={onIrACitas}>
                  Pedir una cita
                </button>
                <small>
                  Si sientes que no puedes más, llama a la Línea 106 (apoyo en salud mental,
                  gratuita, 24 horas). Si estás en peligro inmediato, llama al 123.
                </small>
              </>
            ) : (
              <p>Seguir tu bienestar con constancia te ayuda a conocerte mejor.</p>
            )}
          </div>
        </div>
      )}

      {hoy.length > 0 && (
        <div className="registros-hoy">
          <span>Hoy has registrado:</span>
          {hoy.map((r) => (
            <span className="chip-hoy" key={r.id}>
              {r.emoji} {r.estado} · {r.hora}
            </span>
          ))}
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={guardar} className="checkin-form">
        <section className="tarjeta">
          <h2>1. Tu estado de ánimo</h2>
          <div className="animos">
            {opciones.estados.map((est) => (
              <button
                type="button"
                key={est.id}
                className={`animo ${form.estado_animo_id === est.id ? "activo" : ""}`}
                onClick={() => elegir("estado_animo_id", est.id)}
              >
                <span className="animo-emoji">{est.emoji}</span>
                <span>{est.nombre}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="tarjeta">
          <h2>2. Nivel de estrés</h2>
          <div className="estres">
            {ETIQUETAS_ESTRES.map((texto, i) => (
              <button
                type="button"
                key={texto}
                className={`estres-opcion nivel-${i + 1} ${
                  form.nivel_estres === i + 1 ? "activo" : ""
                }`}
                onClick={() => elegir("nivel_estres", i + 1)}
              >
                <strong>{i + 1}</strong>
                <span>{texto}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="tarjeta">
          <h2>3. ¿Qué influye en cómo te sientes?</h2>
          <p className="ayuda">Puedes elegir varios, o ninguno.</p>
          <div className="factores">
            {opciones.factores.map((f) => (
              <button
                type="button"
                key={f.id}
                className={`factor ${form.factores.includes(f.id) ? "activo" : ""}`}
                onClick={() => alternarFactor(f.id)}
              >
                {f.nombre}
              </button>
            ))}
          </div>
        </section>

        <section className="tarjeta">
          <h2>4. ¿Quieres contarnos algo más?</h2>
          <div className="form-group">
            <textarea
              rows={3}
              maxLength={1000}
              placeholder="Opcional. Escribe lo que quieras..."
              value={form.comentario}
              onChange={(e) => elegir("comentario", e.target.value)}
            />
          </div>
        </section>

        <button type="submit" className="auth-button boton-verde" disabled={cargando}>
          {cargando ? "Guardando..." : "Guardar mi registro"}
        </button>
      </form>
    </div>
  );
}

export default CheckinBienestar;

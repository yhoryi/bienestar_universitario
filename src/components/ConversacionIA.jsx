// Va en: src/components/ConversacionIA.jsx
import { useEffect, useRef, useState } from "react";
import { Send, Info, LifeBuoy } from "lucide-react";
import { api } from "../services/conversacionApi";

const MAX = 1000;

const SUGERENCIAS = [
  "Me siento estresado/a por los exámenes",
  "No he dormido bien últimamente",
  "Me siento solo/a",
  "Tengo mucha ansiedad",
];

function ConversacionIA({ nombre, onIrACitas }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [error, setError] = useState("");
  const finRef = useRef(null);

  // Cargar la conversación anterior
  useEffect(() => {
    api("/historial")
      .then((filas) => {
        const lista = [];
        filas.forEach((f) => {
          lista.push({ id: `u${f.id}`, rol: "usuario", texto: f.mensaje });
          if (f.respuesta_ia) {
            lista.push({
              id: `i${f.id}`,
              rol: "ia",
              texto: f.respuesta_ia,
              riesgo: f.categoria_detectada === "riesgo",
            });
          }
        });
        setMensajes(lista);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargandoHistorial(false));
  }, []);

  // Bajar al último mensaje
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, enviando]);

  const enviar = async (contenido) => {
    const mensaje = (contenido ?? texto).trim();
    if (!mensaje || enviando) return;

    setError("");
    setTexto("");
    setEnviando(true);
    setMensajes((prev) => [...prev, { id: `tmp${Date.now()}`, rol: "usuario", texto: mensaje }]);

    try {
      const datos = await api("/mensaje", { method: "POST", body: { mensaje } });
      setMensajes((prev) => [
        ...prev,
        { id: `i${datos.id}`, rol: "ia", texto: datos.respuesta, riesgo: datos.riesgo },
      ]);
    } catch (err) {
      // Se quita el mensaje que no se pudo enviar y se devuelve al cuadro de texto
      setMensajes((prev) => prev.slice(0, -1));
      setTexto(mensaje);
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const alPresionarTecla = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const vacio = !cargandoHistorial && mensajes.length === 0;

  return (
    <div className="modulo">
      <header className="modulo-encabezado">
        <h1>Conversación</h1>
        <p>Un espacio para contar cómo te sientes y recibir acompañamiento.</p>
      </header>

      <div className="chat-aviso">
        <Info size={16} />
        <span>
          Estás hablando con una inteligencia artificial. Orienta y acompaña, pero no reemplaza a un
          profesional. Tus mensajes se guardan para dar continuidad a la conversación y se procesan
          con un servicio de IA externo.
        </span>
      </div>

      <div className="chat">
        <div className="chat-mensajes">
          {vacio && (
            <>
              <div className="burbuja ia">
                Hola{nombre ? `, ${nombre}` : ""}. Soy tu acompañante de bienestar. Puedes contarme
                cómo te sientes o qué te preocupa, sin prisa. ¿Cómo has estado hoy?
              </div>
              <div className="sugerencias">
                {SUGERENCIAS.map((s) => (
                  <button key={s} className="sugerencia" onClick={() => enviar(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {mensajes.map((m) => (
            <div key={m.id} className={`fila-mensaje ${m.rol}`}>
              <div className={`burbuja ${m.rol}`}>{m.texto}</div>

              {m.riesgo && (
                <div className="apoyo-inmediato">
                  <LifeBuoy size={20} />
                  <div>
                    <strong>No tienes que pasar por esto sola/o.</strong>
                    <p>
                      Puedes llamar ahora a la <b>Línea 106</b> (apoyo en salud mental, gratuita, 24
                      horas) o al <b>123</b> si estás en peligro inmediato.
                    </p>
                    <button className="btn-apoyo" onClick={onIrACitas}>
                      Pedir una cita con Bienestar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {enviando && (
            <div className="burbuja ia escribiendo" aria-label="Escribiendo">
              <span />
              <span />
              <span />
            </div>
          )}

          <div ref={finRef} />
        </div>

        {error && <div className="auth-error chat-error">{error}</div>}

        <div className="chat-entrada">
          <textarea
            rows={1}
            maxLength={MAX}
            placeholder="Escribe cómo te sientes..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={alPresionarTecla}
            disabled={enviando}
          />
          <button
            className="chat-enviar"
            onClick={() => enviar()}
            disabled={enviando || !texto.trim()}
            aria-label="Enviar mensaje"
          >
            <Send size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConversacionIA;

import { useState } from "react";
import { Copy, Check, KeyRound } from "lucide-react";

export function Aviso({ tipo = "error", children }) {
  if (!children) return null;
  return <div className={`ad-aviso ad-aviso-${tipo}`}>{children}</div>;
}

export function Vacio({ children }) {
  return <p className="ad-vacio">{children}</p>;
}

export function Campo({ etiqueta, children }) {
  return (
    <label className="ad-campo">
      <span>{etiqueta}</span>
      {children}
    </label>
  );
}

// Muestra una sola vez la contraseña temporal generada por el sistema
export function CredencialesTemporales({ datos, onCerrar }) {
  const [copiado, setCopiado] = useState(false);
  if (!datos) return null;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(
        `Correo: ${datos.email}\nContraseña temporal: ${datos.password_temporal}`
      );
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // el navegador no dio permiso al portapapeles
    }
  };

  return (
    <div className="ad-credenciales" role="status">
      <div className="ad-credenciales-titulo">
        <KeyRound size={18} />
        <strong>{datos.mensaje}</strong>
      </div>
      <p>
        Entrega estas credenciales a la persona.{" "}
        <b>La contraseña solo se muestra ahora</b> y no se podrá volver a consultar.
      </p>
      <div className="ad-credenciales-datos">
        <span>
          Correo: <b>{datos.email}</b>
        </span>
        <span>
          Contraseña temporal: <code>{datos.password_temporal}</code>
        </span>
      </div>
      <div className="ad-credenciales-acciones">
        <button type="button" className="ad-btn" onClick={copiar}>
          {copiado ? <Check size={15} /> : <Copy size={15} />}
          {copiado ? "Copiado" : "Copiar"}
        </button>
        <button type="button" className="ad-btn ad-btn-texto" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

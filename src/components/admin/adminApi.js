import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/admin";

export const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  realizada: "Realizada",
};

// Fecha de hoy en formato YYYY-MM-DD (igual que usa el backend)
export const hoy = () => new Date().toLocaleDateString("en-CA");

export const formatearFecha = (f) =>
  f
    ? new Date(`${f}T12:00:00`).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado;
  }
}

// Llama a /api/admin/<ruta> con el token de la sesión
export async function api(ruta, { metodo = "GET", cuerpo } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi("No se pudo conectar con el servidor", 0);
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    // respuesta sin cuerpo JSON
  }

  if (respuesta.status === 401) {
    // Sesión vencida o token inválido
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.assign("/login");
  }

  if (!respuesta.ok) {
    throw new ErrorApi(datos?.error || "Ocurrió un error", respuesta.status);
  }
  return datos;
}

export const cambiarActivo = (usuarioId, activo) =>
  api(`/usuarios/${usuarioId}/activo`, { metodo: "PATCH", cuerpo: { activo } });

// Carga datos de una ruta GET y permite recargarlos
export function useDatos(ruta) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setDatos(await api(ruta));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [ruta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { datos, error, cargando, recargar: cargar };
}

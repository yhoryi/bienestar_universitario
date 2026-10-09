// Va en: src/services/citasApi.js
const API_URL = "http://localhost:5000/api/citas";

// Hace la petición con el token de la sesión y lanza un Error con el mensaje
// del backend si algo sale mal.
export async function api(ruta = "", { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.error || "Ocurrió un error, intenta de nuevo");
  }

  return datos;
}

export const formatearFecha = (fecha) =>
  new Date(`${fecha}T12:00:00`).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  realizada: "Realizada",
};

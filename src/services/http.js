// Va en: src/services/http.js
// Helper general para llamar a cualquier ruta de la API con el token de la sesión.
// Uso: api("/profesional/perfil")  ·  api("/notificaciones/leer-todas", { method: "PATCH" })
const API_URL = "http://localhost:5000/api";

export async function api(ruta, { method = "GET", body } = {}) {
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

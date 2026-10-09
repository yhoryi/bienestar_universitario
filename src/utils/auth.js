// Va en: src/utils/auth.js
// Funciones para manejar la sesión guardada en localStorage por LoginPage.

// A qué pantalla corresponde cada tipo de usuario
export const rutaPorRol = (tipoUsuario) => {
  if (tipoUsuario === "admin") return "/admin";
  if (tipoUsuario === "profesional") return "/profesional";
  return "/dashboard";
};

// Un JWT trae su fecha de expiración (exp) dentro del payload
const tokenVigente = (token) => {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const cerrarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
};

// Devuelve { token, usuario } si hay una sesión válida, o null
export const getSesion = () => {
  const token = localStorage.getItem("token");
  const guardado = localStorage.getItem("usuario");

  if (!token || !guardado) return null;

  let usuario;
  try {
    usuario = JSON.parse(guardado);
  } catch {
    cerrarSesion();
    return null;
  }

  if (!tokenVigente(token)) {
    cerrarSesion();
    return null;
  }

  return { token, usuario };
};

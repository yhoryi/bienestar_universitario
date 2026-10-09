// Va en: src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { getSesion, rutaPorRol } from "../utils/auth";

// Protege una pantalla: exige sesión y, si se indica, un rol permitido.
//   <ProtectedRoute roles={["admin"]}> ... </ProtectedRoute>
export function ProtectedRoute({ roles, children }) {
  const sesion = getSesion();

  // Sin sesión (o token vencido) -> al login
  if (!sesion) {
    return <Navigate to="/login" replace />;
  }

  // Con sesión pero sin el rol correcto -> a su propia pantalla
  if (roles && !roles.includes(sesion.usuario.tipo_usuario)) {
    return <Navigate to={rutaPorRol(sesion.usuario.tipo_usuario)} replace />;
  }

  return children;
}

// Para login y registro: si ya hay sesión, no tiene sentido mostrarlos
export function PublicOnlyRoute({ children }) {
  const sesion = getSesion();

  if (sesion) {
    return <Navigate to={rutaPorRol(sesion.usuario.tipo_usuario)} replace />;
  }

  return children;
}

// Solo deja entrar si hay sesión (y, opcionalmente, si el rol está permitido)
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import type { Rol } from "../types";

interface Props {
  children: ReactNode;
  roles?: Rol[];
}

export default function RutaProtegida({ children, roles }: Props) {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="pagina">
        <h2>Acceso restringido</h2>
        <p>Tu rol ({usuario.rol}) no tiene permiso para ver esta sección.</p>
      </div>
    );
  }
  return <>{children}</>;
}

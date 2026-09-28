// Guarda QUIÉN inició sesión (usuario + token) y lo comparte con toda la app.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { TOKEN_KEY, USUARIO_KEY } from "../api/client";
import { usuariosApi } from "../api/usuarios";
import type { Usuario } from "../types";

interface AuthContextValue {
  usuario: Usuario | null;
  login: (email: string, password: string) => Promise<Usuario>;
  logout: () => void;
  actualizarUsuario: (usuario: Usuario) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function leerUsuarioGuardado(): Usuario | null {
  const guardado = localStorage.getItem(USUARIO_KEY);
  return guardado ? (JSON.parse(guardado) as Usuario) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(leerUsuarioGuardado);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    setUsuario(null);
  }, []);

  // Si el backend responde 401 (token vencido), se cierra la sesión
  useEffect(() => {
    window.addEventListener("kairos:sesion-expirada", logout);
    return () => window.removeEventListener("kairos:sesion-expirada", logout);
  }, [logout]);

  const login = async (email: string, password: string) => {
    const respuesta = await usuariosApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, respuesta.token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(respuesta.usuario));
    setUsuario(respuesta.usuario);
    return respuesta.usuario;
  };

  const actualizarUsuario = (nuevo: Usuario) => {
    localStorage.setItem(USUARIO_KEY, JSON.stringify(nuevo));
    setUsuario(nuevo);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return contexto;
}

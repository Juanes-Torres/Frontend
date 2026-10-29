// Guarda QUIÉN inició sesión (usuario + token + empresa) y lo comparte con toda la app.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { EMPRESA_KEY, TOKEN_KEY, USUARIO_KEY } from "../api/client";
import { usuariosApi } from "../api/usuarios";
import type { Empresa, Usuario } from "../types";

interface AuthContextValue {
  usuario: Usuario | null;
  empresa: Empresa | null;     // la empresa del empleado; null para clientes y superadmin
  login: (email: string, password: string) => Promise<Usuario>;
  logout: () => void;
  actualizarUsuario: (usuario: Usuario) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function leerGuardado<T>(clave: string): T | null {
  const guardado = localStorage.getItem(clave);
  return guardado ? (JSON.parse(guardado) as T) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => leerGuardado<Usuario>(USUARIO_KEY));
  const [empresa, setEmpresa] = useState<Empresa | null>(() => leerGuardado<Empresa>(EMPRESA_KEY));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    localStorage.removeItem(EMPRESA_KEY);
    setUsuario(null);
    setEmpresa(null);
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
    if (respuesta.empresa) localStorage.setItem(EMPRESA_KEY, JSON.stringify(respuesta.empresa));
    else localStorage.removeItem(EMPRESA_KEY);
    setUsuario(respuesta.usuario);
    setEmpresa(respuesta.empresa ?? null);
    return respuesta.usuario;
  };

  const actualizarUsuario = (nuevo: Usuario) => {
    localStorage.setItem(USUARIO_KEY, JSON.stringify(nuevo));
    setUsuario(nuevo);
  };

  return (
    <AuthContext.Provider value={{ usuario, empresa, login, logout, actualizarUsuario }}>
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

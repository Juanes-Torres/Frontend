// Ayudas compartidas por las pruebas
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { TOKEN_KEY, USUARIO_KEY } from "../api/client";
import type { Rol, Usuario } from "../types";

export function crearUsuario(cambios: Partial<Usuario> = {}): Usuario {
  return {
    id: 1,
    nombre: "Ana Pérez",
    email: "ana@kairos.com",
    rol: "CLIENTE",
    telefono: "3001234567",
    idAlmacen: null,
    fechaRegistro: "2026-10-01",
    activo: true,
    ...cambios,
  };
}

/** Deja una sesión guardada, como si el usuario ya hubiera iniciado sesión. */
export function iniciarSesionComo(rol: Rol, cambios: Partial<Usuario> = {}): Usuario {
  const usuario = crearUsuario({ rol, ...cambios });
  localStorage.setItem(TOKEN_KEY, "token-de-prueba");
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
  return usuario;
}

/** Muestra la ruta actual para comprobar redirecciones. */
function RutaActual() {
  const { pathname } = useLocation();
  return <div data-testid="ruta-actual">{pathname}</div>;
}

/** Pinta un componente con sesión y router, empezando en la ruta indicada. */
export function renderConApp(elemento: ReactElement, { ruta = "/", estado }: { ruta?: string; estado?: unknown } = {}) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[{ pathname: ruta, state: estado }]}>
        {elemento}
        <Routes>
          <Route path="*" element={<RutaActual />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

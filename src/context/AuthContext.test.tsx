import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPRESA_KEY, TOKEN_KEY, USUARIO_KEY } from "../api/client";
import { usuariosApi } from "../api/usuarios";
import { crearEmpresa, crearUsuario, iniciarSesionComo } from "../test/utils";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("../api/usuarios", () => ({ usuariosApi: { login: vi.fn() } }));

const envolver = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe("AuthContext", () => {
  beforeEach(() => {
    vi.mocked(usuariosApi.login).mockResolvedValue({
      token: "jwt-nuevo",
      tipo: "Bearer",
      usuario: crearUsuario({ rol: "ADMINISTRADOR", idEmpresa: 1 }),
      empresa: crearEmpresa(),
    });
  });

  it("empieza sin usuario si no hay sesión guardada", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: envolver });
    expect(result.current.usuario).toBeNull();
  });

  it("recupera la sesión guardada en localStorage al recargar", () => {
    iniciarSesionComo("VENDEDOR");
    const { result } = renderHook(() => useAuth(), { wrapper: envolver });
    expect(result.current.usuario?.rol).toBe("VENDEDOR");
  });

  it("login guarda el token y el usuario", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: envolver });

    await act(() => result.current.login("ana@kairos.com", "123456"));

    expect(usuariosApi.login).toHaveBeenCalledWith("ana@kairos.com", "123456");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("jwt-nuevo");
    expect(result.current.usuario?.rol).toBe("ADMINISTRADOR");
    expect(result.current.empresa?.nombre).toBe("Tecno SAS");
    expect(JSON.parse(localStorage.getItem(EMPRESA_KEY)!).nit).toBe("900111222-3");
  });

  it("login de un cliente o superadmin no guarda empresa", async () => {
    localStorage.setItem(EMPRESA_KEY, JSON.stringify(crearEmpresa()));   // de una sesión anterior
    vi.mocked(usuariosApi.login).mockResolvedValue({
      token: "jwt", tipo: "Bearer", usuario: crearUsuario({ rol: "SUPERADMIN" }), empresa: null,
    });
    const { result } = renderHook(() => useAuth(), { wrapper: envolver });

    await act(() => result.current.login("superadmin@kairos.com", "123456"));

    expect(result.current.empresa).toBeNull();
    expect(localStorage.getItem(EMPRESA_KEY)).toBeNull();
  });

  it("logout borra la sesión", () => {
    iniciarSesionComo("CLIENTE");
    const { result } = renderHook(() => useAuth(), { wrapper: envolver });

    act(() => result.current.logout());

    expect(result.current.usuario).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USUARIO_KEY)).toBeNull();
    expect(localStorage.getItem(EMPRESA_KEY)).toBeNull();
    expect(result.current.empresa).toBeNull();
  });

  it("actualizarUsuario cambia los datos guardados", () => {
    iniciarSesionComo("CLIENTE");
    const { result } = renderHook(() => useAuth(), { wrapper: envolver });

    act(() => result.current.actualizarUsuario(crearUsuario({ nombre: "Ana María" })));

    expect(result.current.usuario?.nombre).toBe("Ana María");
    expect(JSON.parse(localStorage.getItem(USUARIO_KEY)!).nombre).toBe("Ana María");
  });

  it("cierra la sesión cuando llega el evento de sesión expirada", async () => {
    iniciarSesionComo("CLIENTE");
    const { result } = renderHook(() => useAuth(), { wrapper: envolver });

    act(() => {
      window.dispatchEvent(new Event("kairos:sesion-expirada"));
    });

    await waitFor(() => expect(result.current.usuario).toBeNull());
  });

  it("useAuth fuera del proveedor lanza un error claro", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    function SinProveedor() {
      useAuth();
      return null;
    }
    expect(() => render(<SinProveedor />)).toThrow("useAuth debe usarse dentro de <AuthProvider>");
    expect(screen.queryByText(/./)).toBeNull();
  });
});

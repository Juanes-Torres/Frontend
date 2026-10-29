// Pruebas de las rutas de la aplicación completa
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { iniciarSesionComo } from "./test/utils";

vi.mock("./api/catalogo", () => ({
  catalogoApi: { listarCategorias: vi.fn().mockResolvedValue([]), buscarProductos: vi.fn().mockResolvedValue([]) },
}));
vi.mock("./api/empresas", () => ({
  empresasApi: { listarActivas: vi.fn().mockResolvedValue([]), listar: vi.fn().mockResolvedValue([]) },
}));
vi.mock("./api/inventario", () => ({
  inventarioApi: { listarAlmacenes: vi.fn().mockResolvedValue([]), listar: vi.fn().mockResolvedValue([]) },
}));
vi.mock("./api/usuarios", () => ({
  usuariosApi: { listar: vi.fn().mockResolvedValue([]), miPerfil: vi.fn().mockReturnValue(new Promise(() => {})) },
}));

function abrir(ruta: string) {
  window.history.pushState({}, "", ruta);
  render(<App />);
}

describe("App (rutas)", () => {
  beforeEach(() => window.history.pushState({}, "", "/"));

  it.each([
    ["/", "Productos"],
    ["/login", "Iniciar sesión"],
    ["/registro", "Crear cuenta de cliente"],
    ["/registro-empresa", "Registrar mi empresa"],
  ])("la ruta pública %s muestra su página", async (ruta, titulo) => {
    abrir(ruta);
    expect(await screen.findByRole("heading", { name: titulo })).toBeInTheDocument();
  });

  it("una ruta que no existe vuelve al catálogo", async () => {
    abrir("/no-existe");
    expect(await screen.findByRole("heading", { name: "Productos" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("una ruta protegida sin sesión lleva al login", async () => {
    abrir("/perfil");
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it.each([
    ["/perfil", "CLIENTE", /Cargando/],
    ["/admin/productos", "ADMINISTRADOR", "Administrar productos"],
    ["/admin/usuarios", "ADMINISTRADOR", "Administrar usuarios"],
    ["/inventario", "VENDEDOR", "Inventario por almacén"],
    ["/admin/almacenes", "ADMINISTRADOR", "Sedes (almacenes)"],
    ["/ventas", "VENDEDOR", "Agregue al menos un producto."],
    ["/superadmin/empresas", "SUPERADMIN", "Empresas de la plataforma"],
  ] as const)("con sesión, %s muestra su página", async (ruta, rol, texto) => {
    iniciarSesionComo(rol);
    abrir(ruta);
    expect(await screen.findByText(texto)).toBeInTheDocument();
  });

  it("un administrador de empresa no puede entrar a la administración de empresas", async () => {
    iniciarSesionComo("ADMINISTRADOR");
    abrir("/superadmin/empresas");
    expect(await screen.findByText("Acceso restringido")).toBeInTheDocument();
  });

  it("un cliente no puede entrar a la administración", async () => {
    iniciarSesionComo("CLIENTE");
    abrir("/admin/productos");
    expect(await screen.findByText("Acceso restringido")).toBeInTheDocument();
  });
});

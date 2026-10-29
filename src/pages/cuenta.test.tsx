// Pruebas de las páginas de cuenta: login, registro y perfil
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { usuariosApi } from "../api/usuarios";
import { crearUsuario, iniciarSesionComo, renderConApp } from "../test/utils";
import LoginPage from "./LoginPage";
import PerfilPage from "./PerfilPage";
import RegistroPage from "./RegistroPage";

vi.mock("../api/usuarios", () => ({
  usuariosApi: { login: vi.fn(), registrar: vi.fn(), miPerfil: vi.fn(), actualizar: vi.fn() },
}));

describe("LoginPage", () => {
  async function ingresar(email = "ana@kairos.com", password = "123456") {
    await userEvent.type(screen.getByLabelText("Email"), email);
    await userEvent.type(screen.getByLabelText("Contraseña"), password);
    await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));
  }

  it("un cliente entra y vuelve al catálogo", async () => {
    vi.mocked(usuariosApi.login).mockResolvedValue({ token: "t", tipo: "Bearer", usuario: crearUsuario({ rol: "CLIENTE" }), empresa: null });
    renderConApp(<LoginPage />, { ruta: "/login" });

    await ingresar();

    expect(usuariosApi.login).toHaveBeenCalledWith("ana@kairos.com", "123456");
    await waitFor(() => expect(screen.getByTestId("ruta-actual")).toHaveTextContent(/^\/$/));
  });

  it.each([
    ["VENDEDOR", "/ventas"],
    ["ADMINISTRADOR", "/inventario"],
    ["SUPERADMIN", "/superadmin/empresas"],
  ] as const)("un %s entra y va a %s", async (rol, destino) => {
    vi.mocked(usuariosApi.login).mockResolvedValue({ token: "t", tipo: "Bearer", usuario: crearUsuario({ rol }), empresa: null });
    renderConApp(<LoginPage />, { ruta: "/login" });

    await ingresar();

    await waitFor(() => expect(screen.getByTestId("ruta-actual")).toHaveTextContent(destino));
  });

  it("explica por qué no puede entrar si su empresa no está aprobada", async () => {
    vi.mocked(usuariosApi.login).mockRejectedValue(
      new ApiError(401, "La empresa aún no ha sido aprobada por el superadministrador"));
    renderConApp(<LoginPage />, { ruta: "/login" });

    await ingresar();

    expect(await screen.findByText(/aún no ha sido aprobada/)).toBeInTheDocument();
  });

  it("muestra el error de credenciales y se queda en el login", async () => {
    vi.mocked(usuariosApi.login).mockRejectedValue(new ApiError(401, "Credenciales inválidas"));
    renderConApp(<LoginPage />, { ruta: "/login" });

    await ingresar();

    expect(await screen.findByText("Credenciales inválidas (HTTP 401)")).toBeInTheDocument();
    expect(screen.getByTestId("ruta-actual")).toHaveTextContent("/login");
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeEnabled();
  });

  it("muestra el mensaje que deja el registro", () => {
    renderConApp(<LoginPage />, { ruta: "/login", estado: { mensaje: "Cuenta creada" } });
    expect(screen.getByText("Cuenta creada")).toBeInTheDocument();
  });
});

describe("RegistroPage", () => {
  async function llenarYEnviar() {
    await userEvent.type(screen.getByLabelText("Nombre completo"), "Ana");
    await userEvent.type(screen.getByLabelText("Email"), "ana@correo.com");
    await userEvent.type(screen.getByLabelText(/Contraseña/), "123456");
    await userEvent.type(screen.getByLabelText("Teléfono"), "300");
    await userEvent.click(screen.getByRole("button", { name: "Registrarme" }));
  }

  it("crea la cuenta y lleva al login con un mensaje", async () => {
    vi.mocked(usuariosApi.registrar).mockResolvedValue(crearUsuario({ email: "ana@correo.com" }));
    renderConApp(<RegistroPage />, { ruta: "/registro" });

    await llenarYEnviar();

    expect(usuariosApi.registrar).toHaveBeenCalledWith({
      nombre: "Ana", email: "ana@correo.com", password: "123456", telefono: "300",
    });
    await waitFor(() => expect(screen.getByTestId("ruta-actual")).toHaveTextContent("/login"));
  });

  it("muestra el error si el email ya existe", async () => {
    vi.mocked(usuariosApi.registrar).mockRejectedValue(new ApiError(409, "El email ya está registrado"));
    renderConApp(<RegistroPage />, { ruta: "/registro" });

    await llenarYEnviar();

    expect(await screen.findByText("El email ya está registrado (HTTP 409)")).toBeInTheDocument();
    expect(screen.getByTestId("ruta-actual")).toHaveTextContent("/registro");
  });
});

describe("PerfilPage", () => {
  beforeEach(() => {
    iniciarSesionComo("VENDEDOR");
  });

  it("muestra los datos frescos del backend", async () => {
    vi.mocked(usuariosApi.miPerfil).mockResolvedValue(crearUsuario({ rol: "VENDEDOR", idAlmacen: 2 }));
    renderConApp(<PerfilPage />);

    expect(await screen.findByText("Mi perfil")).toBeInTheDocument();
    expect(screen.getByText("ana@kairos.com")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("Tecno SAS (NIT 900111222-3)")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Ana Pérez");
  });

  it("muestra Inactivo, sin almacén y teléfono vacío si no tiene", async () => {
    vi.mocked(usuariosApi.miPerfil).mockResolvedValue(crearUsuario({ activo: false, telefono: null }));
    renderConApp(<PerfilPage />);

    expect(await screen.findByText("Inactivo")).toBeInTheDocument();
    expect(screen.queryByText("Almacén")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Teléfono")).toHaveValue("");
  });

  it("muestra el error si no puede cargar el perfil", async () => {
    vi.mocked(usuariosApi.miPerfil).mockRejectedValue(new ApiError(500, "Falla del servidor"));
    renderConApp(<PerfilPage />);

    expect(await screen.findByText("Falla del servidor (HTTP 500)")).toBeInTheDocument();
    expect(screen.getByText(/Cargando/)).toBeInTheDocument();
  });

  it("guarda los cambios y actualiza la sesión", async () => {
    vi.mocked(usuariosApi.miPerfil).mockResolvedValue(crearUsuario());
    vi.mocked(usuariosApi.actualizar).mockResolvedValue(crearUsuario({ nombre: "Ana María", telefono: "311" }));
    renderConApp(<PerfilPage />);

    const nombre = await screen.findByLabelText("Nombre");
    await userEvent.clear(nombre);
    await userEvent.type(nombre, "Ana María");
    await userEvent.clear(screen.getByLabelText("Teléfono"));
    await userEvent.type(screen.getByLabelText("Teléfono"), "311");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(usuariosApi.actualizar).toHaveBeenCalledWith(1, "Ana María", "311");
    expect(await screen.findByText("Datos actualizados correctamente")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("kairos_usuario")!).nombre).toBe("Ana María");
  });

  it("muestra el error si no se pudo guardar", async () => {
    vi.mocked(usuariosApi.miPerfil).mockResolvedValue(crearUsuario());
    vi.mocked(usuariosApi.actualizar).mockRejectedValue(new ApiError(400, "Nombre inválido"));
    renderConApp(<PerfilPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Nombre inválido (HTTP 400)")).toBeInTheDocument();
  });
});

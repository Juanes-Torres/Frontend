// Pruebas del registro de empresas y de su administración por el superadmin
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { empresasApi } from "../api/empresas";
import { crearEmpresa, crearUsuario, iniciarSesionComo, renderConApp } from "../test/utils";
import RegistroEmpresaPage from "./RegistroEmpresaPage";
import SuperadminEmpresasPage from "./SuperadminEmpresasPage";

vi.mock("../api/empresas", () => ({
  empresasApi: { registrar: vi.fn(), listar: vi.fn(), cambiarEstado: vi.fn() },
}));

describe("RegistroEmpresaPage", () => {
  async function llenarYEnviar() {
    await userEvent.type(screen.getByLabelText("Razón social"), "Tecno SAS");
    await userEvent.type(screen.getByLabelText("NIT"), "900111222-3");
    await userEvent.type(screen.getByLabelText("Email de la empresa"), "contacto@tecno.com");
    const [telEmpresa, telAdmin] = screen.getAllByLabelText("Teléfono");
    await userEvent.type(telEmpresa, "6011234");
    await userEvent.type(screen.getByLabelText("Nombre completo"), "Ana Pérez");
    await userEvent.type(screen.getByLabelText("Email (para iniciar sesión)"), "ana@tecno.com");
    await userEvent.type(screen.getByLabelText(/Contraseña/), "secreto1");
    await userEvent.type(telAdmin, "300");
    await userEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));
  }

  it("envía la empresa y su administrador y avisa que queda pendiente", async () => {
    vi.mocked(empresasApi.registrar).mockResolvedValue({
      empresa: crearEmpresa({ estado: "PENDIENTE" }),
      administrador: crearUsuario({ rol: "ADMINISTRADOR" }),
      mensaje: "Empresa registrada",
    });
    renderConApp(<RegistroEmpresaPage />, { ruta: "/registro-empresa" });

    await llenarYEnviar();

    expect(empresasApi.registrar).toHaveBeenCalledWith({
      nombre: "Tecno SAS", nit: "900111222-3", email: "contacto@tecno.com", telefono: "6011234",
      administrador: { nombre: "Ana Pérez", email: "ana@tecno.com", password: "secreto1", telefono: "300" },
    });
    expect(await screen.findByText("Tu empresa quedó pendiente de aprobación")).toBeInTheDocument();
    expect(screen.getByText("Tecno SAS")).toBeInTheDocument();
    expect(screen.getByText("ana@tecno.com")).toBeInTheDocument();
  });

  it("muestra el error si el NIT ya existe", async () => {
    vi.mocked(empresasApi.registrar).mockRejectedValue(new ApiError(409, "Ya existe una empresa con ese NIT"));
    renderConApp(<RegistroEmpresaPage />, { ruta: "/registro-empresa" });

    await llenarYEnviar();

    expect(await screen.findByText("Ya existe una empresa con ese NIT (HTTP 409)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar solicitud" })).toBeEnabled();
  });
});

describe("SuperadminEmpresasPage", () => {
  const pendiente = crearEmpresa({ id: 1, nombre: "Nueva SAS", estado: "PENDIENTE" });
  const activa = crearEmpresa({ id: 2, nombre: "Activa SAS", estado: "ACTIVA", telefono: "601" });
  const suspendida = crearEmpresa({ id: 3, nombre: "Suspendida SAS", estado: "SUSPENDIDA" });
  const rechazada = crearEmpresa({ id: 4, nombre: "Rechazada SAS", estado: "RECHAZADA" });

  beforeEach(() => {
    iniciarSesionComo("SUPERADMIN");
    vi.mocked(empresasApi.listar).mockResolvedValue([pendiente, activa, suspendida, rechazada]);
  });

  const filaDe = async (nombre: string) => (await screen.findByText(nombre)).closest("tr")!;
  const botones = (fila: HTMLElement) => within(fila).queryAllByRole("button").map((b) => b.textContent);

  it("empieza mostrando las pendientes y permite cambiar el filtro", async () => {
    renderConApp(<SuperadminEmpresasPage />);
    await screen.findByText("Nueva SAS");
    expect(empresasApi.listar).toHaveBeenLastCalledWith("PENDIENTE");

    await userEvent.selectOptions(screen.getByLabelText("Estado"), "");
    await waitFor(() => expect(empresasApi.listar).toHaveBeenLastCalledWith(undefined));

    await userEvent.selectOptions(screen.getByLabelText("Estado"), "SUSPENDIDA");
    await waitFor(() => expect(empresasApi.listar).toHaveBeenLastCalledWith("SUSPENDIDA"));
  });

  it("muestra solo las acciones que permite cada estado", async () => {
    renderConApp(<SuperadminEmpresasPage />);

    expect(botones(await filaDe("Nueva SAS"))).toEqual(["Aprobar", "Rechazar"]);
    expect(botones(await filaDe("Activa SAS"))).toEqual(["Suspender"]);
    expect(botones(await filaDe("Suspendida SAS"))).toEqual(["Reactivar"]);
    expect(botones(await filaDe("Rechazada SAS"))).toEqual([]);
    expect(within(await filaDe("Activa SAS")).getByText("601")).toBeInTheDocument();
    expect(within(await filaDe("Nueva SAS")).getByText("Pendiente")).toBeInTheDocument();
  });

  it.each([
    ["Nueva SAS", "Aprobar", "aprobar", 1, 'Empresa "Nueva SAS" aprobada'],
    ["Nueva SAS", "Rechazar", "rechazar", 1, 'Empresa "Nueva SAS" rechazada'],
    ["Activa SAS", "Suspender", "suspender", 2, 'Empresa "Activa SAS" suspendida'],
    ["Suspendida SAS", "Reactivar", "reactivar", 3, 'Empresa "Suspendida SAS" reactivada'],
  ])("%s: %s", async (nombre, boton, accion, id, aviso) => {
    vi.mocked(empresasApi.cambiarEstado).mockResolvedValue(pendiente);
    const confirmar = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderConApp(<SuperadminEmpresasPage />);

    await userEvent.click(within(await filaDe(nombre)).getByRole("button", { name: boton }));

    expect(confirmar).toHaveBeenCalledWith(`¿Seguro que quiere ${accion} la empresa "${nombre}"?`);
    expect(empresasApi.cambiarEstado).toHaveBeenCalledWith(id, accion);
    expect(await screen.findByText(aviso)).toBeInTheDocument();
  });

  it("no hace nada si se cancela, y muestra el error si falla", async () => {
    vi.mocked(empresasApi.cambiarEstado).mockRejectedValue(new ApiError(400, "Solo se puede aprobar una empresa pendiente"));
    vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderConApp(<SuperadminEmpresasPage />);
    const aprobar = within(await filaDe("Nueva SAS")).getByRole("button", { name: "Aprobar" });

    await userEvent.click(aprobar);
    expect(empresasApi.cambiarEstado).not.toHaveBeenCalled();

    await userEvent.click(aprobar);
    expect(await screen.findByText("Solo se puede aprobar una empresa pendiente (HTTP 400)")).toBeInTheDocument();
  });

  it("avisa cuando no hay empresas en ese estado", async () => {
    vi.mocked(empresasApi.listar).mockResolvedValue([]);
    renderConApp(<SuperadminEmpresasPage />);
    expect(await screen.findByText("No hay empresas en este estado.")).toBeInTheDocument();
  });

  it("muestra el error si no puede cargar las empresas", async () => {
    vi.mocked(empresasApi.listar).mockRejectedValue(new ApiError(403, "Sin permiso"));
    renderConApp(<SuperadminEmpresasPage />);
    expect(await screen.findByText("Sin permiso (HTTP 403)")).toBeInTheDocument();
  });
});

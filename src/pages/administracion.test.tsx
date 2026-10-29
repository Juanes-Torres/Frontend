// Pruebas de la administración de usuarios y del inventario
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { catalogoApi } from "../api/catalogo";
import { inventarioApi } from "../api/inventario";
import { usuariosApi } from "../api/usuarios";
import { crearUsuario, iniciarSesionComo, renderConApp } from "../test/utils";
import type { Almacen, Inventario } from "../types";
import AdminUsuariosPage from "./AdminUsuariosPage";
import InventarioPage from "./InventarioPage";

vi.mock("../api/usuarios", () => ({
  usuariosApi: { listar: vi.fn(), crearEmpleado: vi.fn(), activar: vi.fn(), desactivar: vi.fn() },
}));
vi.mock("../api/inventario", () => ({
  inventarioApi: { listarAlmacenes: vi.fn(), listar: vi.fn(), bajoStock: vi.fn(), registrar: vi.fn(), ajustar: vi.fn() },
}));
vi.mock("../api/catalogo", () => ({ catalogoApi: { buscarProductos: vi.fn() } }));

const almacenes: Almacen[] = [
  { id: 1, nombre: "Sede Norte", ciudad: "Bogotá", direccion: null, estado: "ACTIVO" },
  { id: 2, nombre: "Sede Sur", ciudad: "Cali", direccion: null, estado: "ACTIVO" },
];

beforeEach(() => {
  vi.mocked(inventarioApi.listarAlmacenes).mockResolvedValue(almacenes);
});

describe("AdminUsuariosPage", () => {
  const admin = crearUsuario({ id: 1, nombre: "Admin", rol: "ADMINISTRADOR" });
  const vendedor = crearUsuario({ id: 2, nombre: "Luis", email: "luis@kairos.com", rol: "VENDEDOR", idAlmacen: 1 });
  const inactivo = crearUsuario({ id: 3, nombre: "Marta", email: "marta@kairos.com", rol: "VENDEDOR", activo: false });

  beforeEach(() => {
    iniciarSesionComo("ADMINISTRADOR", { id: 1 });
    vi.mocked(usuariosApi.listar).mockResolvedValue([admin, vendedor, inactivo]);
  });

  const filaDe = async (nombre: string) => (await screen.findByText(nombre)).closest("tr")!;

  it("lista los usuarios con su sede y estado", async () => {
    renderConApp(<AdminUsuariosPage />);

    expect(await screen.findByText("Usuarios (3)")).toBeInTheDocument();
    expect(within(await filaDe("Luis")).getByText("Sede Norte")).toBeInTheDocument();
    expect(within(await filaDe("Marta")).getByText("Inactivo")).toBeInTheDocument();
    expect(within(await filaDe("Marta")).getByText("—")).toBeInTheDocument();
  });

  it("el administrador no puede desactivarse a sí mismo", async () => {
    renderConApp(<AdminUsuariosPage />);
    expect(within(await filaDe("Admin")).queryByRole("button")).not.toBeInTheDocument();
  });

  it("crea un vendedor con sede", async () => {
    vi.mocked(usuariosApi.crearEmpleado).mockResolvedValue(vendedor);
    renderConApp(<AdminUsuariosPage />);
    await screen.findByRole("option", { name: "Sede Sur (Cali)" });

    await userEvent.type(screen.getByLabelText("Nombre"), "Pedro");
    await userEvent.type(screen.getByLabelText("Email"), "pedro@kairos.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "secreto1");
    await userEvent.type(screen.getByLabelText("Teléfono"), "301");
    await userEvent.selectOptions(screen.getByLabelText("Sede"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Crear empleado" }));

    expect(usuariosApi.crearEmpleado).toHaveBeenCalledWith({
      nombre: "Pedro", email: "pedro@kairos.com", password: "secreto1", rol: "VENDEDOR", telefono: "301", idAlmacen: 2,
    });
    expect(await screen.findByText("Vendedor creado")).toBeInTheDocument();
  });

  it("crea un administrador sin sede", async () => {
    vi.mocked(usuariosApi.crearEmpleado).mockResolvedValue(admin);
    renderConApp(<AdminUsuariosPage />);

    await userEvent.type(screen.getByLabelText("Nombre"), "Sofía");
    await userEvent.type(screen.getByLabelText("Email"), "sofia@kairos.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "secreto1");
    await userEvent.selectOptions(screen.getByLabelText("Rol"), "ADMINISTRADOR");
    await userEvent.click(screen.getByRole("button", { name: "Crear empleado" }));

    expect(usuariosApi.crearEmpleado).toHaveBeenCalledWith(expect.objectContaining({ rol: "ADMINISTRADOR", idAlmacen: null }));
    expect(await screen.findByText("Administrador creado")).toBeInTheDocument();
  });

  it("muestra el error si el email ya existe", async () => {
    vi.mocked(usuariosApi.crearEmpleado).mockRejectedValue(new ApiError(409, "Email repetido"));
    renderConApp(<AdminUsuariosPage />);

    await userEvent.type(screen.getByLabelText("Nombre"), "Pedro");
    await userEvent.type(screen.getByLabelText("Email"), "luis@kairos.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "secreto1");
    await userEvent.click(screen.getByRole("button", { name: "Crear empleado" }));

    expect(await screen.findByText("Email repetido (HTTP 409)")).toBeInTheDocument();
  });

  it("desactiva y activa usuarios cuando se confirma", async () => {
    vi.mocked(usuariosApi.desactivar).mockResolvedValue({ ...vendedor, activo: false });
    vi.mocked(usuariosApi.activar).mockResolvedValue({ ...inactivo, activo: true });
    const confirmar = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderConApp(<AdminUsuariosPage />);

    await userEvent.click(within(await filaDe("Luis")).getByRole("button", { name: "Desactivar" }));
    expect(confirmar).toHaveBeenCalledWith('¿Seguro que quiere desactivar a "Luis"?');
    expect(usuariosApi.desactivar).toHaveBeenCalledWith(2);
    expect(await screen.findByText("Usuario desactivado")).toBeInTheDocument();

    await userEvent.click(within(await filaDe("Marta")).getByRole("button", { name: "Activar" }));
    expect(usuariosApi.activar).toHaveBeenCalledWith(3);
    expect(await screen.findByText("Usuario activado")).toBeInTheDocument();
  });

  it("no cambia el estado si se cancela, y muestra el error si falla", async () => {
    vi.mocked(usuariosApi.desactivar).mockRejectedValue(new ApiError(403, "Sin permiso"));
    vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderConApp(<AdminUsuariosPage />);
    const boton = within(await filaDe("Luis")).getByRole("button", { name: "Desactivar" });

    await userEvent.click(boton);
    expect(usuariosApi.desactivar).not.toHaveBeenCalled();

    await userEvent.click(boton);
    expect(await screen.findByText("Sin permiso (HTTP 403)")).toBeInTheDocument();
  });
});

describe("InventarioPage", () => {
  const filas: Inventario[] = [
    { id: 100, idProducto: 10, producto: "Galaxy S30", idAlmacen: 1, almacen: "Sede Norte",
      cantidadDisponible: 3, stockMinimo: 5, bajoStock: true },
    { id: 101, idProducto: 11, producto: "Audífonos", idAlmacen: 1, almacen: "Sede Norte",
      cantidadDisponible: 20, stockMinimo: 5, bajoStock: false },
  ];

  beforeEach(() => {
    vi.mocked(inventarioApi.listar).mockResolvedValue(filas);
    vi.mocked(inventarioApi.bajoStock).mockResolvedValue([filas[0]]);
    vi.mocked(catalogoApi.buscarProductos).mockResolvedValue([
      { id: 12, nombre: "Parlante", descripcion: null, precio: 1, marca: null, idCategoria: 1 },
    ]);
  });

  it("un vendedor ve el inventario de su sede, sin opciones de administrador", async () => {
    iniciarSesionComo("VENDEDOR", { idAlmacen: 1 });
    renderConApp(<InventarioPage />);

    const fila = (await screen.findByText("Galaxy S30")).closest("tr")!;
    expect(inventarioApi.listar).toHaveBeenCalledWith(1);
    expect(within(fila).getByText("Bajo stock")).toBeInTheDocument();
    expect(screen.queryByLabelText(/bajo stock/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Registrar un producto/)).not.toBeInTheDocument();
    expect(catalogoApi.buscarProductos).not.toHaveBeenCalled();
  });

  it("filtra por almacén y por bajo stock", async () => {
    iniciarSesionComo("ADMINISTRADOR");
    renderConApp(<InventarioPage />);
    await screen.findByRole("option", { name: "Sede Sur (Cali)" });
    const selectorAlmacen = screen.getAllByRole("combobox")[0];

    await userEvent.selectOptions(selectorAlmacen, "2");
    expect(inventarioApi.listar).toHaveBeenLastCalledWith(2);

    await userEvent.selectOptions(selectorAlmacen, "");
    expect(inventarioApi.listar).toHaveBeenLastCalledWith(undefined);

    await userEvent.click(screen.getByLabelText("Solo productos con bajo stock"));
    expect(inventarioApi.bajoStock).toHaveBeenCalled();
    expect(selectorAlmacen).toBeDisabled();
  });

  it("avisa cuando no hay registros", async () => {
    vi.mocked(inventarioApi.listar).mockResolvedValue([]);
    iniciarSesionComo("VENDEDOR");
    renderConApp(<InventarioPage />);
    expect(await screen.findByText("No hay registros de inventario para este filtro.")).toBeInTheDocument();
  });

  it("ajusta el stock con una salida", async () => {
    vi.mocked(inventarioApi.ajustar).mockResolvedValue({ ...filas[1], cantidadDisponible: 18 });
    iniciarSesionComo("VENDEDOR", { idAlmacen: 1 });
    renderConApp(<InventarioPage />);
    const fila = (await screen.findByText("Audífonos")).closest("tr")!;
    const aplicar = within(fila).getByRole("button", { name: "Aplicar" });
    expect(aplicar).toBeDisabled();

    await userEvent.selectOptions(within(fila).getByRole("combobox"), "SALIDA");
    await userEvent.type(within(fila).getByRole("spinbutton"), "2");
    await userEvent.click(aplicar);

    expect(inventarioApi.ajustar).toHaveBeenCalledWith(101, "SALIDA", 2);
    expect(await screen.findByText("Audífonos en Sede Norte: ahora hay 18 unidades")).toBeInTheDocument();
    expect(within(fila).getByRole("spinbutton")).toHaveValue(null);
  });

  it("muestra el error si no hay stock suficiente", async () => {
    vi.mocked(inventarioApi.ajustar).mockRejectedValue(new ApiError(400, "Stock insuficiente"));
    iniciarSesionComo("VENDEDOR", { idAlmacen: 1 });
    renderConApp(<InventarioPage />);
    const fila = (await screen.findByText("Galaxy S30")).closest("tr")!;

    await userEvent.type(within(fila).getByRole("spinbutton"), "50");
    await userEvent.click(within(fila).getByRole("button", { name: "Aplicar" }));

    expect(inventarioApi.ajustar).toHaveBeenCalledWith(100, "ENTRADA", 50);
    expect(await screen.findByText("Stock insuficiente (HTTP 400)")).toBeInTheDocument();
  });

  async function llenarRegistro() {
    await screen.findByRole("option", { name: "Parlante" });
    await userEvent.selectOptions(screen.getByDisplayValue("Producto..."), "12");
    await userEvent.type(screen.getByPlaceholderText("Cantidad inicial"), "7");
    await userEvent.clear(screen.getByPlaceholderText("Stock mínimo"));
    await userEvent.type(screen.getByPlaceholderText("Stock mínimo"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }));
  }

  it("pide elegir un almacén antes de registrar un producto", async () => {
    iniciarSesionComo("ADMINISTRADOR");
    renderConApp(<InventarioPage />);

    await llenarRegistro();

    expect(await screen.findByText("Seleccione primero un almacén")).toBeInTheDocument();
    expect(inventarioApi.registrar).not.toHaveBeenCalled();
  });

  it("registra un producto en el almacén elegido", async () => {
    vi.mocked(inventarioApi.registrar).mockResolvedValue(filas[0]);
    iniciarSesionComo("ADMINISTRADOR", { idAlmacen: 2 });
    renderConApp(<InventarioPage />);

    await llenarRegistro();

    expect(inventarioApi.registrar).toHaveBeenCalledWith(12, 2, 7, 2);
    expect(await screen.findByText("Producto registrado en el almacén")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Stock mínimo")).toHaveValue(5);
  });

  it("muestra el error si el producto ya estaba registrado", async () => {
    vi.mocked(inventarioApi.registrar).mockRejectedValue(new ApiError(409, "Ya existe en el almacén"));
    iniciarSesionComo("ADMINISTRADOR", { idAlmacen: 2 });
    renderConApp(<InventarioPage />);

    await llenarRegistro();

    expect(await screen.findByText("Ya existe en el almacén (HTTP 409)")).toBeInTheDocument();
  });
});

// Pruebas de la operación de la empresa: sedes y ventas
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { catalogoApi } from "../api/catalogo";
import { inventarioApi } from "../api/inventario";
import { ventasApi } from "../api/ventas";
import { iniciarSesionComo, renderConApp } from "../test/utils";
import type { Almacen, Producto, Venta } from "../types";
import AlmacenesPage from "./AlmacenesPage";
import VentasPage from "./VentasPage";

vi.mock("../api/inventario", () => ({
  inventarioApi: {
    listarAlmacenes: vi.fn(), crearAlmacen: vi.fn(), actualizarAlmacen: vi.fn(),
    activarAlmacen: vi.fn(), desactivarAlmacen: vi.fn(),
  },
}));
vi.mock("../api/catalogo", () => ({ catalogoApi: { buscarProductos: vi.fn() } }));
vi.mock("../api/ventas", () => ({ ventasApi: { registrar: vi.fn(), qr: vi.fn() } }));

const almacenes: Almacen[] = [
  { id: 1, nombre: "Sede Norte", ciudad: "Bogotá", direccion: "Cra 7", estado: "ACTIVO", idEmpresa: 1 },
  { id: 2, nombre: "Sede Sur", ciudad: "Cali", direccion: null, estado: "INACTIVO", idEmpresa: 1 },
];

beforeEach(() => {
  vi.mocked(inventarioApi.listarAlmacenes).mockResolvedValue(almacenes);
});

describe("AlmacenesPage", () => {
  beforeEach(() => {
    iniciarSesionComo("ADMINISTRADOR");
  });

  const filaDe = async (nombre: string) => (await screen.findByText(nombre)).closest("tr")!;

  it("lista las sedes con su estado", async () => {
    renderConApp(<AlmacenesPage />);
    expect(await screen.findByText("Sedes (2)")).toBeInTheDocument();
    expect(within(await filaDe("Sede Norte")).getByText("Activo")).toBeInTheDocument();
    expect(within(await filaDe("Sede Sur")).getByText("Inactivo")).toBeInTheDocument();
    expect(within(await filaDe("Sede Sur")).getByText("—")).toBeInTheDocument();
  });

  it("crea una sede", async () => {
    vi.mocked(inventarioApi.crearAlmacen).mockResolvedValue(almacenes[0]);
    renderConApp(<AlmacenesPage />);

    await userEvent.type(screen.getByLabelText("Nombre"), "Sede Centro");
    await userEvent.type(screen.getByLabelText("Ciudad"), "Medellín");
    await userEvent.type(screen.getByLabelText("Dirección"), "Calle 10");
    await userEvent.click(screen.getByRole("button", { name: "Crear sede" }));

    expect(inventarioApi.crearAlmacen).toHaveBeenCalledWith({ nombre: "Sede Centro", ciudad: "Medellín", direccion: "Calle 10" });
    expect(await screen.findByText("Sede creada")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("");
  });

  it("edita una sede y permite cancelar", async () => {
    vi.mocked(inventarioApi.actualizarAlmacen).mockResolvedValue(almacenes[1]);
    renderConApp(<AlmacenesPage />);
    const fila = await filaDe("Sede Sur");

    await userEvent.click(within(fila).getByRole("button", { name: "Editar" }));
    expect(screen.getByText("Editar sede #2")).toBeInTheDocument();
    expect(screen.getByLabelText("Dirección")).toHaveValue("");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("Nueva sede")).toBeInTheDocument();

    await userEvent.click(within(fila).getByRole("button", { name: "Editar" }));
    await userEvent.type(screen.getByLabelText("Dirección"), "Av 6");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(inventarioApi.actualizarAlmacen).toHaveBeenCalledWith(2, { nombre: "Sede Sur", ciudad: "Cali", direccion: "Av 6" });
    expect(await screen.findByText("Sede actualizada")).toBeInTheDocument();
  });

  it("muestra el error si el backend rechaza la sede", async () => {
    vi.mocked(inventarioApi.crearAlmacen).mockRejectedValue(new ApiError(400, "La ciudad es obligatoria"));
    renderConApp(<AlmacenesPage />);

    await userEvent.type(screen.getByLabelText("Nombre"), "X");
    await userEvent.type(screen.getByLabelText("Ciudad"), "Y");
    await userEvent.click(screen.getByRole("button", { name: "Crear sede" }));

    expect(await screen.findByText("La ciudad es obligatoria (HTTP 400)")).toBeInTheDocument();
  });

  it("desactiva y activa sedes cuando se confirma", async () => {
    vi.mocked(inventarioApi.desactivarAlmacen).mockResolvedValue(almacenes[0]);
    vi.mocked(inventarioApi.activarAlmacen).mockResolvedValue(almacenes[1]);
    const confirmar = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    renderConApp(<AlmacenesPage />);

    await userEvent.click(within(await filaDe("Sede Norte")).getByRole("button", { name: "Desactivar" }));
    expect(inventarioApi.desactivarAlmacen).not.toHaveBeenCalled();

    await userEvent.click(within(await filaDe("Sede Norte")).getByRole("button", { name: "Desactivar" }));
    expect(confirmar).toHaveBeenLastCalledWith('¿Seguro que quiere desactivar la sede "Sede Norte"?');
    expect(inventarioApi.desactivarAlmacen).toHaveBeenCalledWith(1);
    expect(await screen.findByText("Sede desactivada")).toBeInTheDocument();

    await userEvent.click(within(await filaDe("Sede Sur")).getByRole("button", { name: "Activar" }));
    expect(inventarioApi.activarAlmacen).toHaveBeenCalledWith(2);
    expect(await screen.findByText("Sede activada")).toBeInTheDocument();
  });

  it("muestra el error si no se puede cambiar el estado", async () => {
    vi.mocked(inventarioApi.desactivarAlmacen).mockRejectedValue(new ApiError(400, "Tiene inventario"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderConApp(<AlmacenesPage />);

    await userEvent.click(within(await filaDe("Sede Norte")).getByRole("button", { name: "Desactivar" }));

    expect(await screen.findByText("Tiene inventario (HTTP 400)")).toBeInTheDocument();
  });
});

describe("VentasPage", () => {
  const productos: Producto[] = [
    { id: 10, nombre: "Galaxy S30", descripcion: null, precio: 1000000, marca: null, idCategoria: 1, idEmpresa: 1 },
    { id: 11, nombre: "Audífonos", descripcion: null, precio: 50000, marca: null, idCategoria: 2, idEmpresa: 1 },
  ];
  const venta: Venta = {
    id: 7, numeroFactura: "FAC-0007", fecha: "2026-10-29T10:00:00", idAlmacen: 1, idVendedor: 1, idCliente: null,
    estado: "COMPLETADA", total: 2050000,
    detalles: [
      { idProducto: 10, cantidad: 2, precioUnitario: 1000000, subtotal: 2000000 },
      { idProducto: 99, cantidad: 1, precioUnitario: 50000, subtotal: 50000 },
    ],
  };

  beforeEach(() => {
    vi.mocked(catalogoApi.buscarProductos).mockResolvedValue(productos);
    vi.mocked(ventasApi.registrar).mockResolvedValue(venta);
    vi.mocked(ventasApi.qr).mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    // jsdom no implementa URL.createObjectURL
    URL.createObjectURL = vi.fn(() => "blob:qr-factura");
    URL.revokeObjectURL = vi.fn();
  });

  async function agregar(producto: string, cantidad: string) {
    await userEvent.selectOptions(screen.getByLabelText("Producto"), within(screen.getByLabelText("Producto"))
      .getByRole("option", { name: new RegExp(producto) }));
    await userEvent.clear(screen.getByLabelText("Cantidad"));
    await userEvent.type(screen.getByLabelText("Cantidad"), cantidad);
    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));
  }

  it("el vendedor vende en su sede: arma la venta, ve la factura y el QR", async () => {
    iniciarSesionComo("VENDEDOR", { idAlmacen: 1 });
    renderConApp(<VentasPage />);
    expect(await screen.findByText("Sede Norte (Bogotá)")).toBeInTheDocument();
    expect(catalogoApi.buscarProductos).toHaveBeenCalledWith(undefined, undefined, 1);
    expect(screen.getByRole("button", { name: "Registrar venta" })).toBeDisabled();

    await agregar("Galaxy", "1");
    await agregar("Galaxy", "1");        // el mismo producto suma cantidades
    await agregar("Audífonos", "3");
    await userEvent.click(within(screen.getByText("Audífonos").closest("tr")!).getByRole("button", { name: "Quitar" }));
    expect(screen.getByText(/Total: \$\s?2\.000\.000/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Email del cliente/), " cliente@correo.com ");
    await userEvent.click(screen.getByRole("button", { name: "Registrar venta" }));

    expect(ventasApi.registrar).toHaveBeenCalledWith({
      idAlmacen: null, emailCliente: "cliente@correo.com", items: [{ idProducto: 10, cantidad: 2 }],
    });
    expect(await screen.findByText("Factura FAC-0007")).toBeInTheDocument();
    expect(screen.getByText("#99")).toBeInTheDocument();   // producto que ya no está en la lista
    expect(await screen.findByAltText("Código QR de la factura FAC-0007")).toHaveAttribute("src", "blob:qr-factura");
    expect(ventasApi.qr).toHaveBeenCalledWith(7);

    await userEvent.click(screen.getByRole("button", { name: "Nueva venta" }));
    expect(screen.getByText("Agregue al menos un producto.")).toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:qr-factura");
  });

  it("el vendedor sin sede asignada lo ve claramente", async () => {
    iniciarSesionComo("VENDEDOR", { idAlmacen: null });
    renderConApp(<VentasPage />);
    expect(await screen.findByText("sin sede asignada")).toBeInTheDocument();
  });

  it("el administrador elige una sede activa y la venta va sin cliente", async () => {
    iniciarSesionComo("ADMINISTRADOR");
    renderConApp(<VentasPage />);
    await screen.findByRole("option", { name: "Sede Norte (Bogotá)" });
    expect(screen.queryByRole("option", { name: "Sede Sur (Cali)" })).not.toBeInTheDocument();   // inactiva

    await agregar("Audífonos", "1");
    expect(screen.getByRole("button", { name: "Registrar venta" })).toBeDisabled();   // falta la sede
    await userEvent.selectOptions(screen.getByLabelText("Sede de la venta"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Registrar venta" }));

    expect(ventasApi.registrar).toHaveBeenCalledWith({
      idAlmacen: 1, emailCliente: null, items: [{ idProducto: 11, cantidad: 1 }],
    });
    expect(await screen.findByText("Factura FAC-0007")).toBeInTheDocument();
  });

  it("si el QR falla, la factura se muestra igual", async () => {
    vi.mocked(ventasApi.qr).mockRejectedValue(new ApiError(503, "Servicio de QR no disponible"));
    iniciarSesionComo("VENDEDOR", { idAlmacen: 1 });
    renderConApp(<VentasPage />);
    await screen.findByText("Sede Norte (Bogotá)");

    await agregar("Galaxy", "1");
    await userEvent.click(screen.getByRole("button", { name: "Registrar venta" }));

    expect(await screen.findByText("Factura FAC-0007")).toBeInTheDocument();
    await waitFor(() => expect(ventasApi.qr).toHaveBeenCalled());
    expect(screen.getByText("Generando el código QR...")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("muestra el error si no hay stock suficiente", async () => {
    vi.mocked(ventasApi.registrar).mockRejectedValue(new ApiError(400, "Galaxy S30: stock insuficiente"));
    iniciarSesionComo("VENDEDOR", { idAlmacen: 1 });
    renderConApp(<VentasPage />);
    await screen.findByText("Sede Norte (Bogotá)");

    await agregar("Galaxy", "50");
    await userEvent.click(screen.getByRole("button", { name: "Registrar venta" }));

    expect(await screen.findByText("Galaxy S30: stock insuficiente (HTTP 400)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar venta" })).toBeEnabled();
  });

  it("muestra el error si no puede cargar los productos", async () => {
    vi.mocked(catalogoApi.buscarProductos).mockRejectedValue(new ApiError(0, "Sin conexión"));
    iniciarSesionComo("ADMINISTRADOR");
    renderConApp(<VentasPage />);
    expect(await screen.findByText("Sin conexión")).toBeInTheDocument();
  });
});

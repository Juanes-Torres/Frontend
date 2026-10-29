// Pruebas del catálogo público y de la administración de productos
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { catalogoApi } from "../api/catalogo";
import { empresasApi } from "../api/empresas";
import { iniciarSesionComo, renderConApp } from "../test/utils";
import type { Producto } from "../types";
import AdminProductosPage from "./AdminProductosPage";
import CatalogoPage from "./CatalogoPage";

vi.mock("../api/empresas", () => ({ empresasApi: { listarActivas: vi.fn() } }));
vi.mock("../api/catalogo", () => ({
  catalogoApi: {
    listarCategorias: vi.fn(),
    crearCategoria: vi.fn(),
    buscarProductos: vi.fn(),
    crearProducto: vi.fn(),
    actualizarProducto: vi.fn(),
    eliminarProducto: vi.fn(),
    renombrarCategoria: vi.fn(),
    buscarPorCodigoBarras: vi.fn(),
  },
}));

const categorias = [{ id: 1, nombre: "Celulares" }, { id: 2, nombre: "Audio" }];
const productos: Producto[] = [
  { id: 10, nombre: "Galaxy S30", descripcion: "Gama alta", precio: 1599000, marca: "Samsung", idCategoria: 1, idEmpresa: 1 },
  { id: 11, nombre: "Audífonos", descripcion: null, precio: 99000, marca: null, idCategoria: 2, idEmpresa: 2 },
];

beforeEach(() => {
  vi.mocked(catalogoApi.listarCategorias).mockResolvedValue(categorias);
  vi.mocked(catalogoApi.buscarProductos).mockResolvedValue(productos);
  vi.mocked(empresasApi.listarActivas).mockResolvedValue([
    { id: 1, nombre: "Tecno SAS", telefono: null },
    { id: 2, nombre: "Audio Ltda", telefono: "601" },
  ]);
});

describe("CatalogoPage", () => {
  it("muestra los productos con su categoría y precio en pesos", async () => {
    renderConApp(<CatalogoPage />);

    expect(await screen.findByText("Galaxy S30")).toBeInTheDocument();
    expect(screen.getByText("2 productos encontrados")).toBeInTheDocument();
    expect(screen.getByText("Samsung")).toBeInTheDocument();
    const tarjeta = screen.getByText("Galaxy S30").closest("article")!;
    expect(within(tarjeta).getByText("Celulares")).toBeInTheDocument();
    expect(within(tarjeta).getByText(/1\.599\.000/)).toBeInTheDocument();
    expect(await within(tarjeta).findByText("Vendido por Tecno SAS")).toBeInTheDocument();
  });

  it("filtra por empresa", async () => {
    renderConApp(<CatalogoPage />);
    await screen.findByRole("option", { name: "Audio Ltda" });

    await userEvent.selectOptions(screen.getByLabelText("Empresa"), "2");
    await waitFor(() => expect(catalogoApi.buscarProductos).toHaveBeenLastCalledWith(undefined, "", 2));

    await userEvent.selectOptions(screen.getByLabelText("Empresa"), "");
    await waitFor(() => expect(catalogoApi.buscarProductos).toHaveBeenLastCalledWith(undefined, "", undefined));
  });

  it("no muestra la empresa si no está en la lista de activas", async () => {
    vi.mocked(empresasApi.listarActivas).mockResolvedValue([]);
    renderConApp(<CatalogoPage />);
    await screen.findByText("Galaxy S30");
    expect(screen.queryByText(/Vendido por/)).not.toBeInTheDocument();
  });

  it("filtra por categoría y por nombre", async () => {
    renderConApp(<CatalogoPage />);
    await screen.findByRole("option", { name: "Audio" });

    await userEvent.selectOptions(screen.getByLabelText("Categoría"), "2");
    await waitFor(() => expect(catalogoApi.buscarProductos).toHaveBeenLastCalledWith(2, "", undefined));

    await userEvent.type(screen.getByPlaceholderText("Buscar productos..."), "  audi ");
    await waitFor(() => expect(catalogoApi.buscarProductos).toHaveBeenLastCalledWith(2, "audi", undefined));

    await userEvent.selectOptions(screen.getByLabelText("Categoría"), "");
    await waitFor(() => expect(catalogoApi.buscarProductos).toHaveBeenLastCalledWith(undefined, "audi", undefined));
  });

  it("Limpiar búsqueda borra el texto", async () => {
    renderConApp(<CatalogoPage />);
    const buscador = screen.getByPlaceholderText("Buscar productos...");
    await userEvent.type(buscador, "tv");

    await userEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));

    expect(buscador).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).not.toBeInTheDocument();
  });

  it("dice cuando hay un solo producto y cuando no hay ninguno", async () => {
    vi.mocked(catalogoApi.buscarProductos).mockResolvedValueOnce([productos[0]]).mockResolvedValue([]);
    renderConApp(<CatalogoPage />);
    expect(await screen.findByText("1 producto encontrado")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Buscar productos..."), "xyz");

    expect(await screen.findByText("No encontramos productos")).toBeInTheDocument();
  });

  it("muestra el error si el backend no responde", async () => {
    vi.mocked(catalogoApi.listarCategorias).mockRejectedValue(new ApiError(0, "No se pudo conectar con el servidor"));
    renderConApp(<CatalogoPage />);
    expect(await screen.findByText("No se pudo conectar con el servidor")).toBeInTheDocument();
  });
});

describe("AdminProductosPage", () => {
  beforeEach(() => {
    iniciarSesionComo("ADMINISTRADOR");
  });

  it("pide solo los productos de su empresa", async () => {
    renderConApp(<AdminProductosPage />);
    await screen.findByText("Productos (2)");
    expect(catalogoApi.buscarProductos).toHaveBeenCalledWith(undefined, undefined, 1);
  });

  it("lista los productos con su categoría", async () => {
    renderConApp(<AdminProductosPage />);
    expect(await screen.findByText("Productos (2)")).toBeInTheDocument();
    const fila = (await screen.findByText("Galaxy S30")).closest("tr")!;
    expect(within(fila).getByText("Celulares")).toBeInTheDocument();
  });

  it("crea un producto con los datos del formulario", async () => {
    vi.mocked(catalogoApi.crearProducto).mockResolvedValue(productos[0]);
    renderConApp(<AdminProductosPage />);
    await screen.findByRole("option", { name: "Audio" });

    await userEvent.type(screen.getByLabelText("Nombre"), "Parlante");
    await userEvent.type(screen.getByLabelText("Descripción"), "Bluetooth");
    await userEvent.type(screen.getByLabelText("Precio (COP)"), "150000");
    await userEvent.type(screen.getByLabelText("Marca"), "JBL");
    await userEvent.selectOptions(screen.getByLabelText("Categoría"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(catalogoApi.crearProducto).toHaveBeenCalledWith({
      nombre: "Parlante", descripcion: "Bluetooth", precio: 150000, marca: "JBL", idCategoria: 2,
    });
    expect(await screen.findByText("Producto creado")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("");
  });

  it("edita un producto existente y permite cancelar", async () => {
    vi.mocked(catalogoApi.actualizarProducto).mockResolvedValue(productos[1]);
    renderConApp(<AdminProductosPage />);
    const fila = (await screen.findByText("Audífonos")).closest("tr")!;

    await userEvent.click(within(fila).getByRole("button", { name: "Editar" }));
    expect(screen.getByText("Editar producto #11")).toBeInTheDocument();
    expect(screen.getByLabelText("Descripción")).toHaveValue("");
    expect(screen.getByLabelText("Marca")).toHaveValue("");

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("Nuevo producto")).toBeInTheDocument();

    await userEvent.click(within(fila).getByRole("button", { name: "Editar" }));
    await userEvent.clear(screen.getByLabelText("Precio (COP)"));
    await userEvent.type(screen.getByLabelText("Precio (COP)"), "89000");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(catalogoApi.actualizarProducto).toHaveBeenCalledWith(11, {
      nombre: "Audífonos", descripcion: "", precio: 89000, marca: "", idCategoria: 2,
    });
    expect(await screen.findByText("Producto actualizado")).toBeInTheDocument();
  });

  it("muestra el error si el backend rechaza el producto", async () => {
    vi.mocked(catalogoApi.crearProducto).mockRejectedValue(new ApiError(400, "Precio inválido", { precio: "debe ser positivo" }));
    renderConApp(<AdminProductosPage />);
    await screen.findByRole("option", { name: "Audio" });

    await userEvent.type(screen.getByLabelText("Nombre"), "X");
    await userEvent.type(screen.getByLabelText("Precio (COP)"), "1");
    await userEvent.selectOptions(screen.getByLabelText("Categoría"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(await screen.findByText("Precio inválido (HTTP 400)")).toBeInTheDocument();
    expect(screen.getByText("debe ser positivo")).toBeInTheDocument();
  });

  it("elimina un producto solo si se confirma", async () => {
    vi.mocked(catalogoApi.eliminarProducto).mockResolvedValue(undefined);
    const confirmar = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderConApp(<AdminProductosPage />);
    const fila = (await screen.findByText("Galaxy S30")).closest("tr")!;

    await userEvent.click(within(fila).getByRole("button", { name: "Eliminar" }));
    expect(catalogoApi.eliminarProducto).not.toHaveBeenCalled();

    await userEvent.click(within(fila).getByRole("button", { name: "Eliminar" }));
    expect(confirmar).toHaveBeenCalledWith('¿Eliminar "Galaxy S30"?');
    expect(catalogoApi.eliminarProducto).toHaveBeenCalledWith(10);
    expect(await screen.findByText("Producto eliminado")).toBeInTheDocument();
  });

  it("muestra el error si no se puede eliminar", async () => {
    vi.mocked(catalogoApi.eliminarProducto).mockRejectedValue(new ApiError(400, "Tiene inventario"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderConApp(<AdminProductosPage />);
    const fila = (await screen.findByText("Galaxy S30")).closest("tr")!;

    await userEvent.click(within(fila).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("Tiene inventario (HTTP 400)")).toBeInTheDocument();
  });

  it("autocompleta el producto con el código de barras", async () => {
    vi.mocked(catalogoApi.buscarPorCodigoBarras).mockResolvedValue({
      codigoBarras: "885909950805", nombre: "iPhone 6", marca: "Apple", descripcion: null,
      categoriaSugerida: "Celulares", fuente: "UPCitemdb",
    });
    renderConApp(<AdminProductosPage />);
    await userEvent.type(screen.getByLabelText("Descripción"), "Usado");

    await userEvent.type(screen.getByLabelText("Código de barras"), " 885909950805 ");
    await userEvent.click(screen.getByRole("button", { name: "Autocompletar" }));

    expect(catalogoApi.buscarPorCodigoBarras).toHaveBeenCalledWith("885909950805");
    expect(await screen.findByText(/Datos sugeridos por UPCitemdb.*Categoría sugerida: Celulares/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("iPhone 6");
    expect(screen.getByLabelText("Marca")).toHaveValue("Apple");
    expect(screen.getByLabelText("Descripción")).toHaveValue("Usado");   // lo que no sugiere, se conserva
  });

  it("sin categoría sugerida no la menciona, y deja los campos que no trae", async () => {
    vi.mocked(catalogoApi.buscarPorCodigoBarras).mockResolvedValue({
      codigoBarras: "1", nombre: null, marca: null, descripcion: "Genérico", categoriaSugerida: null, fuente: "UPCitemdb",
    });
    renderConApp(<AdminProductosPage />);
    await userEvent.type(screen.getByLabelText("Nombre"), "Mi producto");

    await userEvent.type(screen.getByLabelText("Código de barras"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Autocompletar" }));

    expect(await screen.findByText("Datos sugeridos por UPCitemdb. Revísalos antes de guardar.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Mi producto");
    expect(screen.getByLabelText("Descripción")).toHaveValue("Genérico");
  });

  it("muestra el error si el código de barras no existe", async () => {
    vi.mocked(catalogoApi.buscarPorCodigoBarras).mockRejectedValue(new ApiError(404, "No se encontró el código"));
    renderConApp(<AdminProductosPage />);

    await userEvent.type(screen.getByLabelText("Código de barras"), "000");
    await userEvent.click(screen.getByRole("button", { name: "Autocompletar" }));

    expect(await screen.findByText("No se encontró el código (HTTP 404)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Autocompletar" })).toBeEnabled();
  });

  it("renombra una categoría solo si cambia el nombre", async () => {
    vi.mocked(catalogoApi.renombrarCategoria).mockResolvedValue({ id: 2, nombre: "Sonido" });
    const preguntar = vi.spyOn(window, "prompt")
      .mockReturnValueOnce(null)          // canceló
      .mockReturnValueOnce("Audio")       // mismo nombre
      .mockReturnValueOnce("  Sonido ");
    renderConApp(<AdminProductosPage />);
    const item = (await screen.findAllByText("Audio")).find((el) => el.tagName === "LI")!;
    const renombrar = within(item).getByRole("button", { name: "Renombrar" });

    await userEvent.click(renombrar);
    await userEvent.click(renombrar);
    expect(catalogoApi.renombrarCategoria).not.toHaveBeenCalled();

    await userEvent.click(renombrar);
    expect(preguntar).toHaveBeenLastCalledWith('Nuevo nombre para "Audio"', "Audio");
    expect(catalogoApi.renombrarCategoria).toHaveBeenCalledWith(2, "Sonido");
    expect(await screen.findByText("Categoría renombrada")).toBeInTheDocument();
  });

  it("muestra el error si no se puede renombrar", async () => {
    vi.mocked(catalogoApi.renombrarCategoria).mockRejectedValue(new ApiError(409, "Ya existe"));
    vi.spyOn(window, "prompt").mockReturnValue("Celulares");
    renderConApp(<AdminProductosPage />);
    const item = (await screen.findAllByText("Audio")).find((el) => el.tagName === "LI")!;

    await userEvent.click(within(item).getByRole("button", { name: "Renombrar" }));

    expect(await screen.findByText("Ya existe (HTTP 409)")).toBeInTheDocument();
  });

  it("crea una categoría nueva", async () => {
    vi.mocked(catalogoApi.crearCategoria).mockResolvedValue({ id: 3, nombre: "Smartwatches" });
    renderConApp(<AdminProductosPage />);

    await userEvent.type(screen.getByPlaceholderText("Ej. Smartwatches"), "Smartwatches");
    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));

    expect(catalogoApi.crearCategoria).toHaveBeenCalledWith("Smartwatches");
    expect(await screen.findByText("Categoría creada")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ej. Smartwatches")).toHaveValue("");
  });

  it("muestra el error si la categoría ya existe", async () => {
    vi.mocked(catalogoApi.crearCategoria).mockRejectedValue(new ApiError(409, "La categoría ya existe"));
    renderConApp(<AdminProductosPage />);

    await userEvent.type(screen.getByPlaceholderText("Ej. Smartwatches"), "Audio");
    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));

    expect(await screen.findByText("La categoría ya existe (HTTP 409)")).toBeInTheDocument();
  });
});

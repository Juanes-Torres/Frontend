// Comprueba que cada servicio llama al endpoint correcto del backend
import { beforeEach, describe, expect, it, vi } from "vitest";
import { catalogoApi } from "./catalogo";
import { empresasApi } from "./empresas";
import { ventasApi } from "./ventas";
import { inventarioApi } from "./inventario";
import { usuariosApi } from "./usuarios";

const BASE = "http://localhost:8080";
let fetchFalso: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchFalso = vi.fn().mockImplementation(() => Promise.resolve(new Response("{}", { status: 200 })));
  vi.stubGlobal("fetch", fetchFalso);
});

/** Devuelve [url, método, body] de la última llamada a fetch. */
function ultimaLlamada() {
  const [url, opciones] = fetchFalso.mock.calls.at(-1)!;
  return [url, opciones.method ?? "GET", opciones.body ? JSON.parse(opciones.body) : undefined];
}

describe("catalogoApi", () => {
  it.each([
    ["listarCategorias", () => catalogoApi.listarCategorias(), "/api/categorias", "GET", undefined],
    ["crearCategoria", () => catalogoApi.crearCategoria("Audio"), "/api/categorias", "POST", { nombre: "Audio" }],
    ["buscarProductos sin filtros", () => catalogoApi.buscarProductos(), "/api/productos", "GET", undefined],
    ["buscarProductos por categoría", () => catalogoApi.buscarProductos(3), "/api/productos?idCategoria=3", "GET", undefined],
    ["buscarProductos por categoría y nombre", () => catalogoApi.buscarProductos(3, "tv"), "/api/productos?idCategoria=3&nombre=tv", "GET", undefined],
    ["eliminarProducto", () => catalogoApi.eliminarProducto(9), "/api/productos/9", "DELETE", undefined],
    ["buscarProductos de una empresa", () => catalogoApi.buscarProductos(undefined, undefined, 4), "/api/productos?idEmpresa=4", "GET", undefined],
    ["renombrarCategoria", () => catalogoApi.renombrarCategoria(2, "Sonido"), "/api/categorias/2", "PUT", { nombre: "Sonido" }],
    ["buscarPorCodigoBarras", () => catalogoApi.buscarPorCodigoBarras("885 909"), "/api/productos/codigo-barras/885%20909", "GET", undefined],
  ])("%s", async (_nombre, llamar, ruta, metodo, body) => {
    await llamar();
    expect(ultimaLlamada()).toEqual([BASE + ruta, metodo, body]);
  });

  it("crearProducto y actualizarProducto envían el producto", async () => {
    const producto = { nombre: "Tv", descripcion: "", precio: 10, marca: "LG", idCategoria: 1 };

    await catalogoApi.crearProducto(producto);
    expect(ultimaLlamada()).toEqual([`${BASE}/api/productos`, "POST", producto]);

    await catalogoApi.actualizarProducto(4, producto);
    expect(ultimaLlamada()).toEqual([`${BASE}/api/productos/4`, "PUT", producto]);
  });
});

describe("inventarioApi", () => {
  it.each([
    ["listarAlmacenes", () => inventarioApi.listarAlmacenes(), "/api/almacenes", "GET", undefined],
    ["listar todo", () => inventarioApi.listar(), "/api/inventario", "GET", undefined],
    ["listar por almacén", () => inventarioApi.listar(2), "/api/inventario?idAlmacen=2", "GET", undefined],
    ["bajoStock", () => inventarioApi.bajoStock(), "/api/inventario/bajo-stock", "GET", undefined],
    ["registrar", () => inventarioApi.registrar(1, 2, 10, 3), "/api/inventario", "POST",
      { idProducto: 1, idAlmacen: 2, cantidadInicial: 10, stockMinimo: 3 }],
    ["ajustar", () => inventarioApi.ajustar(7, "SALIDA", 2), "/api/inventario/7/ajuste", "PATCH",
      { tipo: "SALIDA", cantidad: 2 }],
    ["cambiarStockMinimo", () => inventarioApi.cambiarStockMinimo(7, 4), "/api/inventario/7/stock-minimo", "PATCH",
      { stockMinimo: 4 }],
    ["crearAlmacen", () => inventarioApi.crearAlmacen({ nombre: "Sur", ciudad: "Cali", direccion: "" }), "/api/almacenes", "POST",
      { nombre: "Sur", ciudad: "Cali", direccion: "" }],
    ["actualizarAlmacen", () => inventarioApi.actualizarAlmacen(3, { nombre: "Sur", ciudad: "Cali", direccion: "Cra 1" }),
      "/api/almacenes/3", "PUT", { nombre: "Sur", ciudad: "Cali", direccion: "Cra 1" }],
    ["activarAlmacen", () => inventarioApi.activarAlmacen(3), "/api/almacenes/3/activar", "PATCH", undefined],
    ["desactivarAlmacen", () => inventarioApi.desactivarAlmacen(3), "/api/almacenes/3/desactivar", "PATCH", undefined],
  ])("%s", async (_nombre, llamar, ruta, metodo, body) => {
    await llamar();
    expect(ultimaLlamada()).toEqual([BASE + ruta, metodo, body]);
  });
});

describe("empresasApi", () => {
  const registro = {
    nombre: "Tecno", nit: "900-1", email: "t@t.co", telefono: "",
    administrador: { nombre: "Ana", email: "a@t.co", password: "123456", telefono: "" },
  };

  it.each([
    ["registrar", () => empresasApi.registrar(registro), "/api/empresas", "POST", registro],
    ["listarActivas", () => empresasApi.listarActivas(), "/api/empresas/activas", "GET", undefined],
    ["listar todas", () => empresasApi.listar(), "/api/empresas", "GET", undefined],
    ["listar por estado", () => empresasApi.listar("PENDIENTE"), "/api/empresas?estado=PENDIENTE", "GET", undefined],
    ["aprobar", () => empresasApi.cambiarEstado(5, "aprobar"), "/api/empresas/5/aprobar", "PATCH", undefined],
    ["suspender", () => empresasApi.cambiarEstado(5, "suspender"), "/api/empresas/5/suspender", "PATCH", undefined],
  ])("%s", async (_nombre, llamar, ruta, metodo, body) => {
    await llamar();
    expect(ultimaLlamada()).toEqual([BASE + ruta, metodo, body]);
  });
});

describe("ventasApi", () => {
  it("registrar envía la sede, el cliente y los productos", async () => {
    const venta = { idAlmacen: 1, emailCliente: null, items: [{ idProducto: 10, cantidad: 2 }] };
    await ventasApi.registrar(venta);
    expect(ultimaLlamada()).toEqual([`${BASE}/api/ventas`, "POST", venta]);
  });

  it("qr descarga la imagen de la factura", async () => {
    fetchFalso.mockResolvedValueOnce(new Response("png", { status: 200, headers: { "Content-Type": "image/png" } }));
    const imagen = await ventasApi.qr(8);
    expect(fetchFalso.mock.calls.at(-1)![0]).toBe(`${BASE}/api/ventas/8/qr`);
    expect(imagen.type).toBe("image/png");
  });
});

describe("usuariosApi", () => {
  const empleado = {
    nombre: "Luis", email: "luis@kairos.com", password: "secreto1",
    rol: "VENDEDOR" as const, telefono: "", idAlmacen: 1,
  };

  it.each([
    ["registrar", () => usuariosApi.registrar({ nombre: "Ana", email: "a@b.co", password: "123456", telefono: "" }),
      "/api/usuarios", "POST", { nombre: "Ana", email: "a@b.co", password: "123456", telefono: "" }],
    ["login", () => usuariosApi.login("a@b.co", "123456"), "/api/usuarios/login", "POST",
      { email: "a@b.co", password: "123456" }],
    ["miPerfil", () => usuariosApi.miPerfil(), "/api/usuarios/me", "GET", undefined],
    ["actualizar", () => usuariosApi.actualizar(1, "Ana", "300"), "/api/usuarios/1", "PUT",
      { nombre: "Ana", telefono: "300" }],
    ["listar", () => usuariosApi.listar(), "/api/usuarios", "GET", undefined],
    ["crearEmpleado", () => usuariosApi.crearEmpleado(empleado), "/api/usuarios/empleados", "POST", empleado],
    ["activar", () => usuariosApi.activar(3), "/api/usuarios/3/activar", "PATCH", undefined],
    ["desactivar", () => usuariosApi.desactivar(3), "/api/usuarios/3/desactivar", "PATCH", undefined],
  ])("%s", async (_nombre, llamar, ruta, metodo, body) => {
    await llamar();
    expect(ultimaLlamada()).toEqual([BASE + ruta, metodo, body]);
  });
});

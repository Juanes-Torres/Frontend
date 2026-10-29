// Comprueba que cada servicio llama al endpoint correcto del backend
import { beforeEach, describe, expect, it, vi } from "vitest";
import { catalogoApi } from "./catalogo";
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
  ])("%s", async (_nombre, llamar, ruta, metodo, body) => {
    await llamar();
    expect(ultimaLlamada()).toEqual([BASE + ruta, metodo, body]);
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

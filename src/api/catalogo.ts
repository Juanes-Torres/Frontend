// Servicio de consumo de API: categorías y productos
import { apiFetch, json } from "./client";
import type { Categoria, DatosCodigoBarras, Producto, ProductoRequest } from "../types";

export const catalogoApi = {
  listarCategorias: () => apiFetch<Categoria[]>("/api/categorias"),

  crearCategoria: (nombre: string) =>
    apiFetch<Categoria>("/api/categorias", { method: "POST", body: json({ nombre }) }),

  renombrarCategoria: (id: number, nombre: string) =>
    apiFetch<Categoria>(`/api/categorias/${id}`, { method: "PUT", body: json({ nombre }) }),

  // Público: solo muestra productos de empresas activas. idEmpresa filtra una sola empresa.
  buscarProductos: (idCategoria?: number, nombre?: string, idEmpresa?: number) => {
    const params = new URLSearchParams();
    if (idEmpresa) params.set("idEmpresa", String(idEmpresa));
    if (idCategoria) params.set("idCategoria", String(idCategoria));
    if (nombre) params.set("nombre", nombre);
    const query = params.toString();
    return apiFetch<Producto[]>(`/api/productos${query ? `?${query}` : ""}`);
  },

  // Solo ADMINISTRADOR: sugiere nombre, marca y descripción (API externa con límite diario)
  buscarPorCodigoBarras: (codigo: string) =>
    apiFetch<DatosCodigoBarras>(`/api/productos/codigo-barras/${encodeURIComponent(codigo)}`),

  crearProducto: (datos: ProductoRequest) =>
    apiFetch<Producto>("/api/productos", { method: "POST", body: json(datos) }),

  actualizarProducto: (id: number, datos: ProductoRequest) =>
    apiFetch<Producto>(`/api/productos/${id}`, { method: "PUT", body: json(datos) }),

  eliminarProducto: (id: number) => apiFetch<void>(`/api/productos/${id}`, { method: "DELETE" }),
};

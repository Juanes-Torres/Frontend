// Servicio de consumo de API: categorías y productos
import { apiFetch, json } from "./client";
import type { Categoria, Producto, ProductoRequest } from "../types";

export const catalogoApi = {
  listarCategorias: () => apiFetch<Categoria[]>("/api/categorias"),

  crearCategoria: (nombre: string) =>
    apiFetch<Categoria>("/api/categorias", { method: "POST", body: json({ nombre }) }),

  buscarProductos: (idCategoria?: number, nombre?: string) => {
    const params = new URLSearchParams();
    if (idCategoria) params.set("idCategoria", String(idCategoria));
    if (nombre) params.set("nombre", nombre);
    const query = params.toString();
    return apiFetch<Producto[]>(`/api/productos${query ? `?${query}` : ""}`);
  },

  crearProducto: (datos: ProductoRequest) =>
    apiFetch<Producto>("/api/productos", { method: "POST", body: json(datos) }),

  actualizarProducto: (id: number, datos: ProductoRequest) =>
    apiFetch<Producto>(`/api/productos/${id}`, { method: "PUT", body: json(datos) }),

  eliminarProducto: (id: number) => apiFetch<void>(`/api/productos/${id}`, { method: "DELETE" }),
};

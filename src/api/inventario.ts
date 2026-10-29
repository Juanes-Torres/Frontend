// Servicio de consumo de API: almacenes e inventario
import { apiFetch, json } from "./client";
import type { Almacen, Inventario, TipoMovimiento } from "../types";

export interface AlmacenRequest {
  nombre: string;
  ciudad: string;
  direccion: string;
}

export const inventarioApi = {
  // ADMINISTRADOR y VENDEDOR: las sedes de su empresa
  listarAlmacenes: () => apiFetch<Almacen[]>("/api/almacenes"),

  // Solo ADMINISTRADOR
  crearAlmacen: (datos: AlmacenRequest) =>
    apiFetch<Almacen>("/api/almacenes", { method: "POST", body: json(datos) }),

  actualizarAlmacen: (id: number, datos: AlmacenRequest) =>
    apiFetch<Almacen>(`/api/almacenes/${id}`, { method: "PUT", body: json(datos) }),

  activarAlmacen: (id: number) => apiFetch<Almacen>(`/api/almacenes/${id}/activar`, { method: "PATCH" }),

  desactivarAlmacen: (id: number) => apiFetch<Almacen>(`/api/almacenes/${id}/desactivar`, { method: "PATCH" }),

  listar: (idAlmacen?: number) =>
    apiFetch<Inventario[]>(`/api/inventario${idAlmacen ? `?idAlmacen=${idAlmacen}` : ""}`),

  bajoStock: () => apiFetch<Inventario[]>("/api/inventario/bajo-stock"),

  registrar: (idProducto: number, idAlmacen: number, cantidadInicial: number, stockMinimo: number) =>
    apiFetch<Inventario>("/api/inventario", {
      method: "POST",
      body: json({ idProducto, idAlmacen, cantidadInicial, stockMinimo }),
    }),

  ajustar: (id: number, tipo: TipoMovimiento, cantidad: number) =>
    apiFetch<Inventario>(`/api/inventario/${id}/ajuste`, { method: "PATCH", body: json({ tipo, cantidad }) }),

  cambiarStockMinimo: (id: number, stockMinimo: number) =>
    apiFetch<Inventario>(`/api/inventario/${id}/stock-minimo`, { method: "PATCH", body: json({ stockMinimo }) }),
};

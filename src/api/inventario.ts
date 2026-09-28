// Servicio de consumo de API: almacenes e inventario
import { apiFetch, json } from "./client";
import type { Almacen, Inventario, TipoMovimiento } from "../types";

export const inventarioApi = {
  listarAlmacenes: () => apiFetch<Almacen[]>("/api/almacenes"),

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
};

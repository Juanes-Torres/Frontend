// Servicio de consumo de API: ventas y facturas
import { apiArchivo, apiFetch, json } from "./client";
import type { Venta } from "../types";

export interface RegistrarVentaRequest {
  idAlmacen: number | null;              // el vendedor vende en su sede: el backend la toma del token
  emailCliente: string | null;           // opcional: un CLIENTE activo
  items: { idProducto: number; cantidad: number }[];
}

export const ventasApi = {
  // ADMINISTRADOR y VENDEDOR: descuenta el stock y genera el número de factura
  registrar: (datos: RegistrarVentaRequest) =>
    apiFetch<Venta>("/api/ventas", { method: "POST", body: json(datos) }),

  // Imagen PNG con el QR de la factura
  qr: (id: number) => apiArchivo(`/api/ventas/${id}/qr`),
};

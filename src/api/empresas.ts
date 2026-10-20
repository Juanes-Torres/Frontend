// Servicio de consumo de API: empresas (multiempresa)
import { apiFetch, json } from "./client";
import type { Empresa } from "../types";

export interface RegistroEmpresaRequest {
  nombre: string;
  nit: string;
  email: string;
  telefono: string;
  administrador: {
    nombre: string;
    email: string;
    password: string;
    telefono: string;
  };
}

export const empresasApi = {
  // Público: crea la empresa (PENDIENTE) y su ADMINISTRADOR en una sola operación
  registrar: (datos: RegistroEmpresaRequest) =>
    apiFetch<Empresa>("/api/empresas", { method: "POST", body: json(datos) }),
};

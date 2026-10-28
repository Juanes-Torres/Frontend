// Servicio de consumo de API: empresas (multiempresa)
import { apiFetch, json } from "./client";
import type { Empresa, Usuario } from "../types";

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

export interface RegistroEmpresaResponse {
  empresa: Empresa;
  administrador: Usuario;
  mensaje: string;
}

export const empresasApi = {
  // Público: crea la empresa (PENDIENTE) y su ADMINISTRADOR en una sola operación
  registrar: (datos: RegistroEmpresaRequest) =>
    apiFetch<RegistroEmpresaResponse>("/api/empresas", { method: "POST", body: json(datos) }),
};

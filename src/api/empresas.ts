// Servicio de consumo de API: empresas (multiempresa)
import { apiFetch, json } from "./client";
import type { Empresa, EmpresaPublica, EstadoEmpresa, Usuario } from "../types";

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

/** Acciones del superadmin sobre una empresa (PATCH /api/empresas/{id}/{accion}) */
export type AccionEmpresa = "aprobar" | "rechazar" | "suspender" | "reactivar";

export const empresasApi = {
  // Público: crea la empresa (PENDIENTE) y su ADMINISTRADOR en una sola operación
  registrar: (datos: RegistroEmpresaRequest) =>
    apiFetch<RegistroEmpresaResponse>("/api/empresas", { method: "POST", body: json(datos) }),

  // Público: empresas activas, para que el cliente elija dónde comprar
  listarActivas: () => apiFetch<EmpresaPublica[]>("/api/empresas/activas"),

  // Solo SUPERADMIN
  listar: (estado?: EstadoEmpresa) => apiFetch<Empresa[]>(`/api/empresas${estado ? `?estado=${estado}` : ""}`),

  cambiarEstado: (id: number, accion: AccionEmpresa) =>
    apiFetch<Empresa>(`/api/empresas/${id}/${accion}`, { method: "PATCH" }),
};

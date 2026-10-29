// Servicio de consumo de API: usuarios y autenticación
import { apiFetch, json } from "./client";
import type { LoginResponse, Rol, Usuario } from "../types";

export interface RegistroRequest {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
}

export interface EmpleadoRequest {
  nombre: string;
  email: string;
  password: string;
  rol: Exclude<Rol, "CLIENTE">;
  telefono: string;
  idAlmacen: number | null;
}

export const usuariosApi = {
  registrar: (datos: RegistroRequest) =>
    apiFetch<Usuario>("/api/usuarios", { method: "POST", body: json(datos) }),

  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/api/usuarios/login", { method: "POST", body: json({ email, password }) }),

  miPerfil: () => apiFetch<Usuario>("/api/usuarios/me"),

  actualizar: (id: number, nombre: string, telefono: string) =>
    apiFetch<Usuario>(`/api/usuarios/${id}`, { method: "PUT", body: json({ nombre, telefono }) }),

  // Solo ADMINISTRADOR
  listar: () => apiFetch<Usuario[]>("/api/usuarios"),

  crearEmpleado: (datos: EmpleadoRequest) =>
    apiFetch<Usuario>("/api/usuarios/empleados", { method: "POST", body: json(datos) }),

  activar: (id: number) => apiFetch<Usuario>(`/api/usuarios/${id}/activar`, { method: "PATCH" }),

  desactivar: (id: number) => apiFetch<Usuario>(`/api/usuarios/${id}/desactivar`, { method: "PATCH" }),
};

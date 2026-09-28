// Servicio de consumo de API: usuarios y autenticación
import { apiFetch, json } from "./client";
import type { LoginResponse, Usuario } from "../types";

export interface RegistroRequest {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
}

export const usuariosApi = {
  registrar: (datos: RegistroRequest) =>
    apiFetch<Usuario>("/api/usuarios", { method: "POST", body: json(datos) }),

  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/api/usuarios/login", { method: "POST", body: json({ email, password }) }),

  miPerfil: () => apiFetch<Usuario>("/api/usuarios/me"),

  actualizar: (id: number, nombre: string, telefono: string) =>
    apiFetch<Usuario>(`/api/usuarios/${id}`, { method: "PUT", body: json({ nombre, telefono }) }),
};

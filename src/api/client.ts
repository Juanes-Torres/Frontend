// Cliente HTTP central: TODAS las llamadas al backend pasan por aquí.
// Agrega el token JWT automáticamente y convierte los errores de la API en ApiError.
import { config } from "../config";

const API_URL = config.apiUrl;

export const TOKEN_KEY = "kairos_token";
export const USUARIO_KEY = "kairos_usuario";
export const EMPRESA_KEY = "kairos_empresa";

export class ApiError extends Error {
  status: number;
  campos: Record<string, string> | null;

  constructor(status: number, mensaje: string, campos: Record<string, string> | null = null) {
    super(mensaje);
    this.status = status;
    this.campos = campos;
  }
}

/** Hace la petición con el token y convierte los errores de la API en ApiError. */
async function peticion(ruta: string, opciones: RequestInit): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(opciones.headers);
  if (opciones.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. ¿Está encendido el backend?");
  }

  if (!respuesta.ok) {
    const texto = await respuesta.text();
    const datos = texto ? JSON.parse(texto) : null;
    // Token vencido o inválido: cerrar sesión en toda la app
    if (respuesta.status === 401 && token) {
      window.dispatchEvent(new Event("kairos:sesion-expirada"));
    }
    throw new ApiError(respuesta.status, datos?.mensaje ?? `Error ${respuesta.status}`, datos?.campos ?? null);
  }
  return respuesta;
}

export async function apiFetch<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await peticion(ruta, opciones);
  if (respuesta.status === 204) return undefined as T; // DELETE exitoso: no hay cuerpo
  const texto = await respuesta.text();
  return (texto ? JSON.parse(texto) : null) as T;
}

/** Para respuestas que no son JSON (ej. la imagen PNG del QR de una factura). */
export async function apiArchivo(ruta: string): Promise<Blob> {
  return (await peticion(ruta, {})).blob();
}

/** Convierte un objeto en JSON para enviarlo en el body. */
export const json = (datos: unknown): string => JSON.stringify(datos);

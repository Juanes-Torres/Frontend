// Cliente HTTP central: TODAS las llamadas al backend pasan por aquí.
// Agrega el token JWT automáticamente y convierte los errores de la API en ApiError.

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const TOKEN_KEY = "kairos_token";
export const USUARIO_KEY = "kairos_usuario";

export class ApiError extends Error {
  status: number;
  campos: Record<string, string> | null;

  constructor(status: number, mensaje: string, campos: Record<string, string> | null = null) {
    super(mensaje);
    this.status = status;
    this.campos = campos;
  }
}

export async function apiFetch<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
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

  if (respuesta.status === 204) return undefined as T; // DELETE exitoso: no hay cuerpo

  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : null;

  if (!respuesta.ok) {
    // Token vencido o inválido: cerrar sesión en toda la app
    if (respuesta.status === 401 && token) {
      window.dispatchEvent(new Event("kairos:sesion-expirada"));
    }
    throw new ApiError(respuesta.status, datos?.mensaje ?? `Error ${respuesta.status}`, datos?.campos ?? null);
  }
  return datos as T;
}

/** Convierte un objeto en JSON para enviarlo en el body. */
export const json = (datos: unknown): string => JSON.stringify(datos);

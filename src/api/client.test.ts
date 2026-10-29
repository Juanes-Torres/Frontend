import { describe, expect, it, vi } from "vitest";
import { ApiError, TOKEN_KEY, apiFetch, json } from "./client";

/** Reemplaza fetch por uno falso que responde con el estado y cuerpo indicados. */
function responder(status: number, cuerpo?: unknown) {
  const texto = cuerpo === undefined ? "" : JSON.stringify(cuerpo);
  const fetchFalso = vi.fn().mockResolvedValue(new Response(status === 204 ? null : texto, { status }));
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

/** Llama a la API esperando que falle y devuelve el error. */
async function capturarError(ruta: string): Promise<ApiError> {
  try {
    await apiFetch(ruta);
  } catch (e) {
    return e as ApiError;
  }
  throw new Error(`Se esperaba que ${ruta} fallara`);
}

describe("apiFetch", () => {
  it("llama al backend con la URL base y devuelve el JSON", async () => {
    const fetchFalso = responder(200, [{ id: 1, nombre: "Celulares" }]);

    const datos = await apiFetch("/api/categorias");

    expect(datos).toEqual([{ id: 1, nombre: "Celulares" }]);
    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/categorias");
    expect(opciones.headers.get("Authorization")).toBeNull();
    expect(opciones.headers.get("Content-Type")).toBeNull();
  });

  it("agrega el token y el Content-Type cuando hay sesión y body", async () => {
    localStorage.setItem(TOKEN_KEY, "abc123");
    const fetchFalso = responder(201, { id: 5 });

    await apiFetch("/api/productos", { method: "POST", body: json({ nombre: "Tv" }) });

    const [, opciones] = fetchFalso.mock.calls[0];
    expect(opciones.method).toBe("POST");
    expect(opciones.body).toBe('{"nombre":"Tv"}');
    expect(opciones.headers.get("Authorization")).toBe("Bearer abc123");
    expect(opciones.headers.get("Content-Type")).toBe("application/json");
  });

  it("devuelve undefined cuando la respuesta es 204 (sin cuerpo)", async () => {
    responder(204);
    await expect(apiFetch("/api/productos/1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("devuelve null cuando la respuesta exitosa viene vacía", async () => {
    responder(200);
    await expect(apiFetch("/api/algo")).resolves.toBeNull();
  });

  it("convierte un error de la API en ApiError con mensaje y campos", async () => {
    responder(400, { mensaje: "Datos inválidos", campos: { email: "no es válido" } });

    const error = await capturarError("/api/usuarios");

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe("Datos inválidos");
    expect(error.campos).toEqual({ email: "no es válido" });
  });

  it("usa un mensaje genérico si el error no trae cuerpo", async () => {
    responder(500);

    const error = await capturarError("/api/usuarios");

    expect(error.message).toBe("Error 500");
    expect(error.campos).toBeNull();
  });

  it("avisa que la sesión expiró cuando hay token y la API responde 401", async () => {
    localStorage.setItem(TOKEN_KEY, "vencido");
    responder(401, { mensaje: "Token inválido" });
    const escuchar = vi.fn();
    window.addEventListener("kairos:sesion-expirada", escuchar);

    await expect(apiFetch("/api/usuarios/me")).rejects.toThrow("Token inválido");

    expect(escuchar).toHaveBeenCalledTimes(1);
    window.removeEventListener("kairos:sesion-expirada", escuchar);
  });

  it("no avisa sesión expirada en un 401 sin token (ej. login fallido)", async () => {
    responder(401, { mensaje: "Credenciales inválidas" });
    const escuchar = vi.fn();
    window.addEventListener("kairos:sesion-expirada", escuchar);

    await expect(apiFetch("/api/usuarios/login")).rejects.toThrow("Credenciales inválidas");

    expect(escuchar).not.toHaveBeenCalled();
    window.removeEventListener("kairos:sesion-expirada", escuchar);
  });

  it("lanza ApiError con status 0 si el backend no responde", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const error = await capturarError("/api/categorias");

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/No se pudo conectar/);
  });
});

describe("json", () => {
  it("convierte un objeto en texto JSON", () => {
    expect(json({ a: 1 })).toBe('{"a":1}');
  });
});

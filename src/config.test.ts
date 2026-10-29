import { afterEach, describe, expect, it, vi } from "vitest";

// config.ts lee la configuración al cargarse: cada prueba lo vuelve a importar
async function cargarConfig() {
  vi.resetModules();
  return (await import("./config")).config;
}

afterEach(() => {
  delete window.__KAIROS_CONFIG__;
  vi.unstubAllEnvs();
});

describe("config", () => {
  it("usa la dirección que escribe el contenedor en config.js", async () => {
    window.__KAIROS_CONFIG__ = { apiUrl: "https://api.kairos.com" };
    expect((await cargarConfig()).apiUrl).toBe("https://api.kairos.com");
  });

  it("usa VITE_API_URL si config.js no trae dirección", async () => {
    window.__KAIROS_CONFIG__ = {};
    vi.stubEnv("VITE_API_URL", "http://localhost:9090");
    expect((await cargarConfig()).apiUrl).toBe("http://localhost:9090");
  });

  it("usa localhost:8080 si no hay ninguna configuración", async () => {
    vi.stubEnv("VITE_API_URL", "");
    expect((await cargarConfig()).apiUrl).toBe("http://localhost:8080");
  });
});

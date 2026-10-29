// Se ejecuta antes de cada archivo de pruebas
import "@testing-library/jest-dom/vitest";   // agrega toBeInTheDocument(), toHaveValue()...
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();               // desmonta lo que se pintó en la prueba anterior
  localStorage.clear();    // cada prueba empieza sin sesión
  vi.clearAllMocks();      // borra las llamadas registradas en los mocks
  vi.restoreAllMocks();    // deshace los vi.spyOn (ej. window.confirm)
  vi.unstubAllGlobals();   // deshace los vi.stubGlobal (ej. fetch)
});

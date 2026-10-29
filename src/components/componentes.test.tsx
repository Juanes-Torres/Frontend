import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ApiError } from "../api/client";
import { iniciarSesionComo, renderConApp } from "../test/utils";
import Mensaje from "./Mensaje";
import Navbar from "./Navbar";
import RutaProtegida from "./RutaProtegida";

describe("Mensaje", () => {
  it("no muestra nada si no hay texto ni error", () => {
    const { container } = render(<Mensaje tipo="exito" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra un texto de éxito", () => {
    render(<Mensaje tipo="exito" texto="Producto creado" />);
    expect(screen.getByText("Producto creado").parentElement).toHaveClass("mensaje-exito");
  });

  it("muestra el error de la API con su código HTTP y los campos", () => {
    render(<Mensaje tipo="error" error={new ApiError(400, "Datos inválidos", { email: "no es válido" })} />);
    expect(screen.getByText("Datos inválidos (HTTP 400)")).toBeInTheDocument();
    expect(screen.getByText("email:")).toBeInTheDocument();
    expect(screen.getByText("no es válido")).toBeInTheDocument();
  });

  it("no muestra código HTTP si el backend no respondió (status 0)", () => {
    render(<Mensaje tipo="error" error={new ApiError(0, "Sin conexión")} />);
    expect(screen.getByText("Sin conexión")).toBeInTheDocument();
  });

  it("muestra el mensaje de un Error común", () => {
    render(<Mensaje tipo="error" error={new Error("Seleccione un almacén")} />);
    expect(screen.getByText("Seleccione un almacén")).toBeInTheDocument();
  });

  it("muestra vacío si el error no es un Error", () => {
    const { container } = render(<Mensaje tipo="error" error="raro" />);
    expect(container.querySelector(".mensaje-error p")).toHaveTextContent("");
  });
});

describe("RutaProtegida", () => {
  it("manda al login si no hay sesión", () => {
    renderConApp(<RutaProtegida><p>Secreto</p></RutaProtegida>, { ruta: "/perfil" });
    expect(screen.queryByText("Secreto")).not.toBeInTheDocument();
    expect(screen.getByTestId("ruta-actual")).toHaveTextContent("/login");
  });

  it("muestra el contenido si hay sesión y no se piden roles", () => {
    iniciarSesionComo("CLIENTE");
    renderConApp(<RutaProtegida><p>Secreto</p></RutaProtegida>);
    expect(screen.getByText("Secreto")).toBeInTheDocument();
  });

  it("muestra el contenido si el rol está permitido", () => {
    iniciarSesionComo("VENDEDOR");
    renderConApp(<RutaProtegida roles={["ADMINISTRADOR", "VENDEDOR"]}><p>Inventario</p></RutaProtegida>);
    expect(screen.getByText("Inventario")).toBeInTheDocument();
  });

  it("bloquea el acceso si el rol no está permitido", () => {
    iniciarSesionComo("CLIENTE");
    renderConApp(<RutaProtegida roles={["ADMINISTRADOR"]}><p>Admin</p></RutaProtegida>);
    expect(screen.getByText("Acceso restringido")).toBeInTheDocument();
    expect(screen.getByText(/Tu rol \(CLIENTE\)/)).toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });
});

describe("Navbar", () => {
  it("sin sesión muestra Ingresar y Registrarse", () => {
    renderConApp(<Navbar />);
    expect(screen.getByRole("link", { name: "Ingresar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Registrarse" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mi perfil" })).not.toBeInTheDocument();
  });

  it("un cliente ve su perfil pero no las opciones de administración", () => {
    iniciarSesionComo("CLIENTE");
    renderConApp(<Navbar />);
    expect(screen.getByRole("link", { name: "Mi perfil" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Productos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Inventario" })).not.toBeInTheDocument();
  });

  it("un vendedor ve el inventario", () => {
    iniciarSesionComo("VENDEDOR");
    renderConApp(<Navbar />);
    expect(screen.getByRole("link", { name: "Inventario" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
  });

  it("un administrador ve todas las opciones, su nombre y su rol", () => {
    iniciarSesionComo("ADMINISTRADOR", { nombre: "carlos" });
    renderConApp(<Navbar />);
    for (const nombre of ["Productos", "Usuarios", "Inventario"]) {
      expect(screen.getByRole("link", { name: nombre })).toBeInTheDocument();
    }
    expect(screen.getByText("C")).toBeInTheDocument();          // inicial en el avatar
    expect(screen.getByText("ADMINISTRADOR")).toBeInTheDocument();
  });

  it("Salir cierra la sesión y lleva al login", async () => {
    iniciarSesionComo("CLIENTE");
    renderConApp(<Navbar />, { ruta: "/perfil" });

    await userEvent.click(screen.getByRole("button", { name: "Salir" }));

    expect(localStorage.getItem("kairos_token")).toBeNull();
    expect(screen.getByTestId("ruta-actual")).toHaveTextContent("/login");
    expect(screen.getByRole("link", { name: "Ingresar" })).toBeInTheDocument();
  });
});

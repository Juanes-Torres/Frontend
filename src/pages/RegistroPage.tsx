import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usuariosApi } from "../api/usuarios";
import type { RegistroRequest } from "../api/usuarios";
import Mensaje from "../components/Mensaje";

const vacio: RegistroRequest = { nombre: "", email: "", password: "", telefono: "" };

export default function RegistroPage() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState<RegistroRequest>(vacio);
  const [error, setError] = useState<unknown>(null);
  const [cargando, setCargando] = useState(false);

  const cambiar = (campo: keyof RegistroRequest, valor: string) => setDatos({ ...datos, [campo]: valor });

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const creado = await usuariosApi.registrar(datos);       // POST /api/usuarios → 201
      navigate("/login", { state: { mensaje: `Cuenta creada para ${creado.email}. Ya puedes iniciar sesión.` } });
    } catch (err) {
      setError(err);                                           // 400 (campos) o 409 (email repetido)
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="pagina pagina-estrecha">
      <h2>Crear cuenta de cliente</h2>
      <Mensaje tipo="error" error={error} />

      <form onSubmit={enviar} className="formulario">
        <label>
          Nombre completo
          <input value={datos.nombre} onChange={(e) => cambiar("nombre", e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={datos.email} onChange={(e) => cambiar("email", e.target.value)} required />
        </label>
        <label>
          Contraseña (mínimo 6 caracteres)
          <input type="password" value={datos.password} onChange={(e) => cambiar("password", e.target.value)} required />
        </label>
        <label>
          Teléfono
          <input value={datos.telefono} onChange={(e) => cambiar("telefono", e.target.value)} />
        </label>
        <button type="submit" disabled={cargando}>{cargando ? "Creando..." : "Registrarme"}</button>
      </form>

      <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </div>
  );
}

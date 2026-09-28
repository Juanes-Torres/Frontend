import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Mensaje from "../components/Mensaje";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mensajeRegistro = (location.state as { mensaje?: string } | null)?.mensaje;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [cargando, setCargando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();               // evita que el navegador recargue la página
    setError(null);
    setCargando(true);
    try {
      const usuario = await login(email, password);   // 1. llama a POST /api/usuarios/login
      navigate(usuario.rol === "CLIENTE" ? "/" : "/inventario");  // 2. redirige según el rol
    } catch (err) {
      setError(err);                  // 3. muestra el error de la API (ej. 401)
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="pagina pagina-estrecha">
      <h2>Iniciar sesión</h2>
      <Mensaje tipo="exito" texto={mensajeRegistro} />
      <Mensaje tipo="error" error={error} />

      <form onSubmit={enviar} className="formulario">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={cargando}>{cargando ? "Ingresando..." : "Ingresar"}</button>
      </form>

      <p>¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
    </div>
  );
}

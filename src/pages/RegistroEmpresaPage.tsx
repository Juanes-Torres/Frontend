import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { empresasApi } from "../api/empresas";
import Mensaje from "../components/Mensaje";
import type { Empresa } from "../types";

interface Formulario {
  nombre: string;
  nit: string;
  email: string;
  telefono: string;
  adminNombre: string;
  adminEmail: string;
  adminPassword: string;
  adminTelefono: string;
}

const vacio: Formulario = {
  nombre: "", nit: "", email: "", telefono: "",
  adminNombre: "", adminEmail: "", adminPassword: "", adminTelefono: "",
};

export default function RegistroEmpresaPage() {
  const [form, setForm] = useState<Formulario>(vacio);
  const [registrada, setRegistrada] = useState<Empresa | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [cargando, setCargando] = useState(false);

  const cambiar = (campo: keyof Formulario, valor: string) => setForm({ ...form, [campo]: valor });

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const empresa = await empresasApi.registrar({                // POST /api/empresas → 201
        nombre: form.nombre,
        nit: form.nit,
        email: form.email,
        telefono: form.telefono,
        administrador: {
          nombre: form.adminNombre,
          email: form.adminEmail,
          password: form.adminPassword,
          telefono: form.adminTelefono,
        },
      });
      setRegistrada(empresa);
    } catch (err) {
      setError(err);                                               // 400 (campos) o 409 (NIT o email repetido)
    } finally {
      setCargando(false);
    }
  };

  if (registrada) {
    return (
      <div className="pagina pagina-estrecha">
        <h2>Solicitud enviada</h2>
        <Mensaje tipo="exito" texto="Tu empresa quedó pendiente de aprobación" />
        <p>
          Registramos a <strong>{registrada.nombre}</strong> (NIT {registrada.nit}). Cuando el equipo de KAIRÓS
          apruebe la solicitud, el administrador podrá iniciar sesión con <strong>{form.adminEmail}</strong>.
        </p>
        <p><Link to="/">Volver al catálogo</Link></p>
      </div>
    );
  }

  return (
    <div className="pagina pagina-estrecha">
      <h2>Registrar mi empresa</h2>
      <p className="texto-ayuda">Envía los datos de tu empresa y de la persona que la administrará. La cuenta se activa cuando KAIRÓS aprueba la solicitud.</p>
      <Mensaje tipo="error" error={error} />

      <form onSubmit={enviar} className="formulario">
        <fieldset>
          <legend>Datos de la empresa</legend>
          <label>Razón social<input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} maxLength={100} required /></label>
          <label>NIT<input value={form.nit} onChange={(e) => cambiar("nit", e.target.value)} placeholder="900123456-7" maxLength={20} required /></label>
          <label>Email de la empresa<input type="email" value={form.email} onChange={(e) => cambiar("email", e.target.value)} maxLength={100} required /></label>
          <label>Teléfono<input value={form.telefono} onChange={(e) => cambiar("telefono", e.target.value)} maxLength={20} /></label>
        </fieldset>

        <fieldset>
          <legend>Administrador de la cuenta</legend>
          <label>Nombre completo<input value={form.adminNombre} onChange={(e) => cambiar("adminNombre", e.target.value)} maxLength={100} required /></label>
          <label>Email (para iniciar sesión)<input type="email" value={form.adminEmail} onChange={(e) => cambiar("adminEmail", e.target.value)} maxLength={100} required /></label>
          <label>Contraseña (mínimo 6 caracteres)<input type="password" value={form.adminPassword} onChange={(e) => cambiar("adminPassword", e.target.value)} minLength={6} maxLength={72} required /></label>
          <label>Teléfono<input value={form.adminTelefono} onChange={(e) => cambiar("adminTelefono", e.target.value)} maxLength={20} /></label>
        </fieldset>

        <button type="submit" disabled={cargando}>{cargando ? "Enviando..." : "Enviar solicitud"}</button>
      </form>

      <p>¿Eres cliente? <Link to="/registro">Crea tu cuenta de cliente</Link></p>
    </div>
  );
}

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { inventarioApi } from "../api/inventario";
import { usuariosApi } from "../api/usuarios";
import Mensaje from "../components/Mensaje";
import { useAuth } from "../context/AuthContext";
import type { Almacen, Usuario } from "../types";

interface Formulario {
  nombre: string;
  email: string;
  password: string;
  rol: "VENDEDOR" | "ADMINISTRADOR";
  telefono: string;
  idAlmacen: string;
}

const vacio: Formulario = { nombre: "", email: "", password: "", rol: "VENDEDOR", telefono: "", idAlmacen: "" };

export default function AdminUsuariosPage() {
  const { usuario: actual } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [form, setForm] = useState<Formulario>(vacio);
  const [error, setError] = useState<unknown>(null);
  const [exito, setExito] = useState("");

  const cargar = () => {
    usuariosApi.listar().then(setUsuarios).catch(setError);
    inventarioApi.listarAlmacenes().then(setAlmacenes).catch(setError);
  };
  useEffect(cargar, []);

  const avisar = (texto: string) => {
    setError(null);
    setExito(texto);
  };

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    setExito("");
    try {
      await usuariosApi.crearEmpleado({                             // POST → 201
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: form.rol,
        telefono: form.telefono,
        idAlmacen: form.idAlmacen ? Number(form.idAlmacen) : null,
      });
      avisar(`${form.rol === "VENDEDOR" ? "Vendedor" : "Administrador"} creado`);
      setForm(vacio);
      cargar();
    } catch (err) {
      setError(err);
    }
  };

  const cambiarEstado = async (u: Usuario) => {
    const accion = u.activo ? "desactivar" : "activar";
    if (!window.confirm(`¿Seguro que quiere ${accion} a "${u.nombre}"?`)) return;
    setExito("");
    try {
      await (u.activo ? usuariosApi.desactivar(u.id) : usuariosApi.activar(u.id));   // PATCH
      avisar(`Usuario ${u.activo ? "desactivado" : "activado"}`);
      cargar();
    } catch (err) {
      setError(err);
    }
  };

  const cambiar = (campo: keyof Formulario, valor: string) => setForm({ ...form, [campo]: valor });

  return (
    <div className="pagina">
      <h2>Administrar usuarios</h2>
      <Mensaje tipo="exito" texto={exito} />
      <Mensaje tipo="error" error={error} />

      <div className="columnas">
        <section>
          <h3>Nuevo empleado</h3>
          <form onSubmit={crear} className="formulario">
            <label>Nombre<input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} maxLength={100} required /></label>
            <label>Email<input type="email" value={form.email} onChange={(e) => cambiar("email", e.target.value)} maxLength={100} required /></label>
            <label>Contraseña<input type="password" value={form.password} onChange={(e) => cambiar("password", e.target.value)} minLength={6} maxLength={72} required /></label>
            <label>Teléfono<input value={form.telefono} onChange={(e) => cambiar("telefono", e.target.value)} maxLength={20} /></label>
            <label>
              Rol
              <select value={form.rol} onChange={(e) => cambiar("rol", e.target.value)}>
                <option value="VENDEDOR">Vendedor</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </label>
            <label>
              Sede
              <select value={form.idAlmacen} onChange={(e) => cambiar("idAlmacen", e.target.value)}>
                <option value="">Sin sede</option>
                {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.ciudad})</option>)}
              </select>
            </label>
            <div className="acciones">
              <button type="submit">Crear empleado</button>
            </div>
          </form>
        </section>

        <section>
          <h3>Usuarios ({usuarios.length})</h3>
          <table>
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Sede</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td><span className="etiqueta">{u.rol}</span></td>
                  <td>{almacenes.find((a) => a.id === u.idAlmacen)?.nombre ?? "—"}</td>
                  <td>{u.activo ? "Activo" : <span className="etiqueta etiqueta-alerta">Inactivo</span>}</td>
                  <td className="acciones">
                    {/* El administrador no puede desactivarse a sí mismo */}
                    {u.id !== actual?.id && (
                      <button className={u.activo ? "btn-peligro" : "btn-secundario"} onClick={() => cambiarEstado(u)}>
                        {u.activo ? "Desactivar" : "Activar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

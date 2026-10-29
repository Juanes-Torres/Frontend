import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { usuariosApi } from "../api/usuarios";
import { useAuth } from "../context/AuthContext";
import Mensaje from "../components/Mensaje";
import type { Usuario } from "../types";

export default function PerfilPage() {
  const { empresa, actualizarUsuario } = useAuth();
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [exito, setExito] = useState("");

  // Al abrir la página: GET /api/usuarios/me (datos frescos desde la base de datos)
  useEffect(() => {
    usuariosApi
      .miPerfil()
      .then((u) => {
        setPerfil(u);
        setNombre(u.nombre);
        setTelefono(u.telefono ?? "");
      })
      .catch(setError);
  }, []);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!perfil) return;
    setError(null);
    setExito("");
    try {
      const actualizado = await usuariosApi.actualizar(perfil.id, nombre, telefono); // PUT /api/usuarios/{id}
      setPerfil(actualizado);
      actualizarUsuario(actualizado);
      setExito("Datos actualizados correctamente");
    } catch (err) {
      setError(err);
    }
  };

  if (!perfil) return <div className="pagina"><Mensaje tipo="error" error={error} />Cargando...</div>;

  return (
    <div className="pagina pagina-estrecha">
      <h2>Mi perfil</h2>
      <dl className="ficha">
        <dt>Email</dt><dd>{perfil.email}</dd>
        <dt>Rol</dt><dd>{perfil.rol}</dd>
        <dt>Fecha de registro</dt><dd>{perfil.fechaRegistro}</dd>
        <dt>Estado</dt><dd>{perfil.activo ? "Activo" : "Inactivo"}</dd>
        {empresa && (<><dt>Empresa</dt><dd>{empresa.nombre} (NIT {empresa.nit})</dd></>)}
        {perfil.idAlmacen && (<><dt>Almacén</dt><dd>#{perfil.idAlmacen}</dd></>)}
      </dl>

      <h3>Editar datos</h3>
      <Mensaje tipo="exito" texto={exito} />
      <Mensaje tipo="error" error={error} />
      <form onSubmit={guardar} className="formulario">
        <label>
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>
        <label>
          Teléfono
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </label>
        <button type="submit">Guardar cambios</button>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { inventarioApi } from "../api/inventario";
import type { AlmacenRequest } from "../api/inventario";
import Mensaje from "../components/Mensaje";
import type { Almacen } from "../types";

const vacio: AlmacenRequest = { nombre: "", ciudad: "", direccion: "" };

export default function AlmacenesPage() {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [form, setForm] = useState<AlmacenRequest>(vacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [exito, setExito] = useState("");

  const cargar = () => {
    inventarioApi.listarAlmacenes().then(setAlmacenes).catch(setError);
  };
  useEffect(cargar, []);

  const avisar = (texto: string) => {
    setError(null);
    setExito(texto);
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setExito("");
    try {
      if (editandoId) {
        await inventarioApi.actualizarAlmacen(editandoId, form);   // PUT
        avisar("Sede actualizada");
      } else {
        await inventarioApi.crearAlmacen(form);                   // POST → 201
        avisar("Sede creada");
      }
      setForm(vacio);
      setEditandoId(null);
      cargar();
    } catch (err) {
      setError(err);
    }
  };

  const editar = (a: Almacen) => {
    setEditandoId(a.id);
    setForm({ nombre: a.nombre, ciudad: a.ciudad, direccion: a.direccion ?? "" });
  };

  const cambiarEstado = async (a: Almacen) => {
    const activo = a.estado === "ACTIVO";
    if (!window.confirm(`¿Seguro que quiere ${activo ? "desactivar" : "activar"} la sede "${a.nombre}"?`)) return;
    setExito("");
    try {
      await (activo ? inventarioApi.desactivarAlmacen(a.id) : inventarioApi.activarAlmacen(a.id));   // PATCH
      avisar(`Sede ${activo ? "desactivada" : "activada"}`);
      cargar();
    } catch (err) {
      setError(err);
    }
  };

  const cambiar = (campo: keyof AlmacenRequest, valor: string) => setForm({ ...form, [campo]: valor });

  return (
    <div className="pagina">
      <h2>Sedes (almacenes)</h2>
      <Mensaje tipo="exito" texto={exito} />
      <Mensaje tipo="error" error={error} />

      <div className="columnas">
        <section>
          <h3>{editandoId ? `Editar sede #${editandoId}` : "Nueva sede"}</h3>
          <form onSubmit={guardar} className="formulario">
            <label>Nombre<input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} maxLength={100} required /></label>
            <label>Ciudad<input value={form.ciudad} onChange={(e) => cambiar("ciudad", e.target.value)} maxLength={100} required /></label>
            <label>Dirección<input value={form.direccion} onChange={(e) => cambiar("direccion", e.target.value)} maxLength={150} /></label>
            <div className="acciones">
              <button type="submit">{editandoId ? "Guardar cambios" : "Crear sede"}</button>
              {editandoId && (
                <button type="button" className="btn-secundario" onClick={() => { setEditandoId(null); setForm(vacio); }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section>
          <h3>Sedes ({almacenes.length})</h3>
          <table>
            <thead>
              <tr><th>Nombre</th><th>Ciudad</th><th>Dirección</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {almacenes.map((a) => (
                <tr key={a.id}>
                  <td>{a.nombre}</td>
                  <td>{a.ciudad}</td>
                  <td>{a.direccion ?? "—"}</td>
                  <td>{a.estado === "ACTIVO" ? "Activa" : <span className="etiqueta etiqueta-alerta">Inactiva</span>}</td>
                  <td className="acciones">
                    <button className="btn-secundario" onClick={() => editar(a)}>Editar</button>
                    <button className={a.estado === "ACTIVO" ? "btn-peligro" : "btn-secundario"} onClick={() => cambiarEstado(a)}>
                      {a.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                    </button>
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

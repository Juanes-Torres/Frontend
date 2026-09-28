import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { catalogoApi } from "../api/catalogo";
import Mensaje from "../components/Mensaje";
import { formatoPrecio } from "../utils/formato";
import type { Categoria, Producto } from "../types";

interface Formulario {
  nombre: string;
  descripcion: string;
  precio: string;
  marca: string;
  idCategoria: string;
}

const vacio: Formulario = { nombre: "", descripcion: "", precio: "", marca: "", idCategoria: "" };

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState<Formulario>(vacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [exito, setExito] = useState("");

  const cargar = () => {
    catalogoApi.buscarProductos().then(setProductos).catch(setError);
    catalogoApi.listarCategorias().then(setCategorias).catch(setError);
  };
  useEffect(cargar, []);

  const avisar = (texto: string) => {
    setError(null);
    setExito(texto);
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setExito("");
    const datos = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: Number(form.precio),
      marca: form.marca,
      idCategoria: Number(form.idCategoria),
    };
    try {
      if (editandoId) {
        await catalogoApi.actualizarProducto(editandoId, datos);   // PUT
        avisar("Producto actualizado");
      } else {
        await catalogoApi.crearProducto(datos);                    // POST → 201
        avisar("Producto creado");
      }
      setForm(vacio);
      setEditandoId(null);
      cargar();
    } catch (err) {
      setError(err);
    }
  };

  const editar = (p: Producto) => {
    setEditandoId(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      precio: String(p.precio),
      marca: p.marca ?? "",
      idCategoria: String(p.idCategoria),
    });
  };

  const eliminar = async (p: Producto) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try {
      await catalogoApi.eliminarProducto(p.id);                     // DELETE → 204
      avisar("Producto eliminado");
      cargar();
    } catch (err) {
      setError(err);                                               // ej. 400 si tiene inventario
    }
  };

  const crearCategoria = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await catalogoApi.crearCategoria(nuevaCategoria);
      setNuevaCategoria("");
      avisar("Categoría creada");
      cargar();
    } catch (err) {
      setError(err);
    }
  };

  const cambiar = (campo: keyof Formulario, valor: string) => setForm({ ...form, [campo]: valor });

  return (
    <div className="pagina">
      <h2>Administrar productos</h2>
      <Mensaje tipo="exito" texto={exito} />
      <Mensaje tipo="error" error={error} />

      <div className="columnas">
        <section>
          <h3>{editandoId ? `Editar producto #${editandoId}` : "Nuevo producto"}</h3>
          <form onSubmit={guardar} className="formulario">
            <label>Nombre<input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} required /></label>
            <label>Descripción<input value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} /></label>
            <label>Precio (COP)<input type="number" min="0" step="0.01" value={form.precio} onChange={(e) => cambiar("precio", e.target.value)} required /></label>
            <label>Marca<input value={form.marca} onChange={(e) => cambiar("marca", e.target.value)} /></label>
            <label>
              Categoría
              <select value={form.idCategoria} onChange={(e) => cambiar("idCategoria", e.target.value)} required>
                <option value="">Seleccione...</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </label>
            <div className="acciones">
              <button type="submit">{editandoId ? "Guardar cambios" : "Crear producto"}</button>
              {editandoId && (
                <button type="button" className="btn-secundario" onClick={() => { setEditandoId(null); setForm(vacio); }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <h3>Nueva categoría</h3>
          <form onSubmit={crearCategoria} className="formulario-linea">
            <input placeholder="Ej. Smartwatches" value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} required />
            <button type="submit">Agregar</button>
          </form>
        </section>

        <section>
          <h3>Productos ({productos.length})</h3>
          <table>
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th></th></tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.nombre}</td>
                  <td>{categorias.find((c) => c.id === p.idCategoria)?.nombre}</td>
                  <td>{formatoPrecio.format(p.precio)}</td>
                  <td className="acciones">
                    <button className="btn-secundario" onClick={() => editar(p)}>Editar</button>
                    <button className="btn-peligro" onClick={() => eliminar(p)}>Eliminar</button>
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

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { catalogoApi } from "../api/catalogo";
import { inventarioApi } from "../api/inventario";
import { useAuth } from "../context/AuthContext";
import Mensaje from "../components/Mensaje";
import type { Almacen, Inventario, Producto, TipoMovimiento } from "../types";

export default function InventarioPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [idAlmacen, setIdAlmacen] = useState<number | undefined>(usuario?.idAlmacen ?? undefined);
  const [soloBajoStock, setSoloBajoStock] = useState(false);
  const [filas, setFilas] = useState<Inventario[]>([]);
  const [ajustes, setAjustes] = useState<Record<number, { tipo: TipoMovimiento; cantidad: string }>>({});
  const [nuevo, setNuevo] = useState({ idProducto: "", cantidad: "", minimo: "5" });
  const [error, setError] = useState<unknown>(null);
  const [exito, setExito] = useState("");

  useEffect(() => {
    inventarioApi.listarAlmacenes().then(setAlmacenes).catch(setError);
    // Solo se pueden registrar productos de la propia empresa
    if (esAdmin) catalogoApi.buscarProductos(undefined, undefined, usuario?.idEmpresa ?? undefined).then(setProductos).catch(setError);
  }, [esAdmin, usuario?.idEmpresa]);

  const cargar = useCallback(() => {
    const peticion = soloBajoStock ? inventarioApi.bajoStock() : inventarioApi.listar(idAlmacen);
    peticion.then(setFilas).catch(setError);
  }, [idAlmacen, soloBajoStock]);

  useEffect(cargar, [cargar]);

  const ajustar = async (fila: Inventario) => {
    const ajuste = ajustes[fila.id] ?? { tipo: "ENTRADA", cantidad: "" };
    setError(null);
    setExito("");
    try {
      const r = await inventarioApi.ajustar(fila.id, ajuste.tipo, Number(ajuste.cantidad)); // PATCH
      setExito(`${r.producto} en ${r.almacen}: ahora hay ${r.cantidadDisponible} unidades`);
      setAjustes({ ...ajustes, [fila.id]: { tipo: ajuste.tipo, cantidad: "" } });
      cargar();
    } catch (err) {
      setError(err);   // ej. 400 "Stock insuficiente"
    }
  };

  const cambiarMinimo = async (fila: Inventario) => {
    const respuesta = window.prompt(`Stock mínimo para ${fila.producto} en ${fila.almacen}`, String(fila.stockMinimo));
    if (respuesta === null || respuesta.trim() === "") return;
    setError(null);
    setExito("");
    try {
      const r = await inventarioApi.cambiarStockMinimo(fila.id, Number(respuesta));   // PATCH
      setExito(`Stock mínimo de ${r.producto} en ${r.almacen}: ${r.stockMinimo}`);
      cargar();
    } catch (err) {
      setError(err);   // ej. 400 si es negativo
    }
  };

  const registrar = async (e: FormEvent) => {
    e.preventDefault();
    if (!idAlmacen) {
      setError(new Error("Seleccione primero un almacén"));
      return;
    }
    setError(null);
    try {
      await inventarioApi.registrar(Number(nuevo.idProducto), idAlmacen, Number(nuevo.cantidad), Number(nuevo.minimo));
      setExito("Producto registrado en el almacén");
      setNuevo({ idProducto: "", cantidad: "", minimo: "5" });
      cargar();
    } catch (err) {
      setError(err);   // ej. 409 si ya existía
    }
  };

  return (
    <div className="pagina">
      <h2>Inventario por almacén</h2>
      <Mensaje tipo="exito" texto={exito} />
      <Mensaje tipo="error" error={error} />

      <div className="filtros">
        <select
          value={idAlmacen ?? ""}
          disabled={soloBajoStock}
          onChange={(e) => setIdAlmacen(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Todos los almacenes</option>
          {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.ciudad})</option>)}
        </select>
        {esAdmin && (
          <label className="check">
            <input type="checkbox" checked={soloBajoStock} onChange={(e) => setSoloBajoStock(e.target.checked)} />
            Solo productos con bajo stock
          </label>
        )}
      </div>

      <table>
        <thead>
          <tr><th>Producto</th><th>Almacén</th><th>Disponible</th><th>Mínimo</th><th>Ajustar stock</th></tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            const ajuste = ajustes[f.id] ?? { tipo: "ENTRADA" as TipoMovimiento, cantidad: "" };
            return (
              <tr key={f.id} className={f.bajoStock ? "fila-alerta" : ""}>
                <td>{f.producto}</td>
                <td>{f.almacen}</td>
                <td>
                  {f.cantidadDisponible} {f.bajoStock && <span className="etiqueta etiqueta-alerta">Bajo stock</span>}
                </td>
                <td>
                  {f.stockMinimo}{" "}
                  {esAdmin && <button className="btn-link" onClick={() => cambiarMinimo(f)}>Cambiar</button>}
                </td>
                <td className="acciones">
                  <select
                    value={ajuste.tipo}
                    onChange={(e) => setAjustes({ ...ajustes, [f.id]: { ...ajuste, tipo: e.target.value as TipoMovimiento } })}
                  >
                    <option value="ENTRADA">Entrada (+)</option>
                    <option value="SALIDA">Salida (−)</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    className="input-corto"
                    value={ajuste.cantidad}
                    onChange={(e) => setAjustes({ ...ajustes, [f.id]: { ...ajuste, cantidad: e.target.value } })}
                  />
                  <button onClick={() => ajustar(f)} disabled={!ajuste.cantidad}>Aplicar</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filas.length === 0 && <p>No hay registros de inventario para este filtro.</p>}

      {esAdmin && (
        <>
          <h3>Registrar un producto en el almacén seleccionado</h3>
          <form onSubmit={registrar} className="formulario-linea">
            <select value={nuevo.idProducto} onChange={(e) => setNuevo({ ...nuevo, idProducto: e.target.value })} required>
              <option value="">Producto...</option>
              {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <input type="number" min="0" placeholder="Cantidad inicial" value={nuevo.cantidad}
                   onChange={(e) => setNuevo({ ...nuevo, cantidad: e.target.value })} required />
            <input type="number" min="0" placeholder="Stock mínimo" value={nuevo.minimo}
                   onChange={(e) => setNuevo({ ...nuevo, minimo: e.target.value })} required />
            <button type="submit">Registrar</button>
          </form>
        </>
      )}
    </div>
  );
}

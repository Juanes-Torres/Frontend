import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { catalogoApi } from "../api/catalogo";
import { inventarioApi } from "../api/inventario";
import { ventasApi } from "../api/ventas";
import Insignia from "../components/Insignia";
import Mensaje from "../components/Mensaje";
import { useAuth } from "../context/AuthContext";
import { formatoPrecio } from "../utils/formato";
import type { Almacen, Producto, Venta } from "../types";

interface Linea {
  producto: Producto;
  cantidad: number;
}

export default function VentasPage() {
  const { usuario } = useAuth();
  const esVendedor = usuario?.rol === "VENDEDOR";

  const [productos, setProductos] = useState<Producto[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  // El vendedor vende siempre en su sede; el administrador la elige
  const [idAlmacen, setIdAlmacen] = useState(esVendedor ? String(usuario?.idAlmacen ?? "") : "");
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [seleccion, setSeleccion] = useState({ idProducto: "", cantidad: "1" });
  const [emailCliente, setEmailCliente] = useState("");
  const [venta, setVenta] = useState<Venta | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // Solo los productos de la empresa del empleado
    catalogoApi.buscarProductos(undefined, undefined, usuario?.idEmpresa ?? undefined).then(setProductos).catch(setError);
    inventarioApi.listarAlmacenes().then(setAlmacenes).catch(setError);
  }, [usuario?.idEmpresa]);

  // Libera la imagen del QR al salir o al empezar otra venta
  useEffect(() => () => { if (qr) URL.revokeObjectURL(qr); }, [qr]);

  const total = lineas.reduce((suma, l) => suma + l.producto.precio * l.cantidad, 0);
  const nombreProducto = (id: number) => productos.find((p) => p.id === id)?.nombre ?? `#${id}`;
  const sedeDelVendedor = almacenes.find((a) => a.id === usuario?.idAlmacen);

  const agregar = (e: FormEvent) => {
    e.preventDefault();
    const producto = productos.find((p) => p.id === Number(seleccion.idProducto))!;
    const cantidad = Number(seleccion.cantidad);
    // El backend no acepta el mismo producto dos veces: se suman las cantidades
    const existente = lineas.find((l) => l.producto.id === producto.id);
    setLineas(existente
      ? lineas.map((l) => (l === existente ? { ...l, cantidad: l.cantidad + cantidad } : l))
      : [...lineas, { producto, cantidad }]);
    setSeleccion({ idProducto: "", cantidad: "1" });
  };

  const quitar = (id: number) => setLineas(lineas.filter((l) => l.producto.id !== id));

  const registrar = async () => {
    setError(null);
    setEnviando(true);
    try {
      const creada = await ventasApi.registrar({                       // POST /api/ventas → 201
        idAlmacen: esVendedor ? null : Number(idAlmacen),
        emailCliente: emailCliente.trim() || null,
        items: lineas.map((l) => ({ idProducto: l.producto.id, cantidad: l.cantidad })),
      });
      setVenta(creada);
      ventasApi.qr(creada.id).then((imagen) => setQr(URL.createObjectURL(imagen))).catch(() => setQr(null));
    } catch (err) {
      setError(err);   // ej. 400 "Stock insuficiente" o 404 cliente inexistente
    } finally {
      setEnviando(false);
    }
  };

  const nuevaVenta = () => {
    setVenta(null);
    setQr(null);
    setLineas([]);
    setEmailCliente("");
  };

  if (venta) {
    return (
      <div className="pagina pagina-estrecha">
        <h2>Venta registrada <Insignia tipo="Completada" /></h2>
        <p className="texto-ayuda">Factura {venta.numeroFactura}</p>
        <Mensaje tipo="exito" texto="Venta registrada. El stock ya se descontó." />
        <table>
          <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
          <tbody>
            {venta.detalles.map((d) => (
              <tr key={d.idProducto}>
                <td>{nombreProducto(d.idProducto)}</td>
                <td>{d.cantidad}</td>
                <td>{formatoPrecio.format(d.precioUnitario)}</td>
                <td>{formatoPrecio.format(d.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p><strong>Total: {formatoPrecio.format(venta.total)}</strong></p>
        <p className="texto-ayuda">Fecha: {new Date(venta.fecha).toLocaleString("es-CO")}</p>
        {qr ? <img src={qr} alt={`Código QR de la factura ${venta.numeroFactura}`} width={180} height={180} />
            : <p className="texto-ayuda">Generando el código QR...</p>}
        <p><button onClick={nuevaVenta}>Nueva venta</button></p>
      </div>
    );
  }

  return (
    <div className="pagina">
      <h2>Registrar venta</h2>
      <Mensaje tipo="error" error={error} />

      {esVendedor ? (
        <p>Sede: <strong>{sedeDelVendedor ? `${sedeDelVendedor.nombre} (${sedeDelVendedor.ciudad})` : "sin sede asignada"}</strong></p>
      ) : (
        <div className="filtros">
          <label>
            Sede de la venta{" "}
            <select value={idAlmacen} onChange={(e) => setIdAlmacen(e.target.value)}>
              <option value="">Seleccione...</option>
              {almacenes.filter((a) => a.estado === "ACTIVO").map((a) => (
                <option key={a.id} value={a.id}>{a.nombre} ({a.ciudad})</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <form onSubmit={agregar} className="formulario-linea">
        <select aria-label="Producto" value={seleccion.idProducto}
                onChange={(e) => setSeleccion({ ...seleccion, idProducto: e.target.value })} required>
          <option value="">Producto...</option>
          {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {formatoPrecio.format(p.precio)}</option>)}
        </select>
        <input aria-label="Cantidad" type="number" min="1" className="input-corto" value={seleccion.cantidad}
               onChange={(e) => setSeleccion({ ...seleccion, cantidad: e.target.value })} required />
        <button type="submit">Agregar</button>
      </form>

      <table>
        <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>
          {lineas.map((l) => (
            <tr key={l.producto.id}>
              <td>{l.producto.nombre}</td>
              <td>{l.cantidad}</td>
              <td>{formatoPrecio.format(l.producto.precio)}</td>
              <td>{formatoPrecio.format(l.producto.precio * l.cantidad)}</td>
              <td><button className="btn-secundario" onClick={() => quitar(l.producto.id)}>Quitar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {lineas.length === 0 && <p>Agregue al menos un producto.</p>}
      <p><strong>Total: {formatoPrecio.format(total)}</strong></p>

      <div className="formulario">
        <label>
          Email del cliente (opcional)
          <input type="email" value={emailCliente} onChange={(e) => setEmailCliente(e.target.value)}
                 placeholder="cliente@correo.com" />
        </label>
        <button onClick={registrar} disabled={enviando || lineas.length === 0 || (!esVendedor && !idAlmacen)}>
          {enviando ? "Registrando..." : "Registrar venta"}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { catalogoApi } from "../api/catalogo";
import Mensaje from "../components/Mensaje";
import { formatoPrecio } from "../utils/formato";
import type { Categoria, Producto } from "../types";

export default function CatalogoPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [idCategoria, setIdCategoria] = useState<number | undefined>(undefined);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    catalogoApi.listarCategorias().then(setCategorias).catch(setError);
  }, []);

  useEffect(() => {
    const espera = setTimeout(() => {
      catalogoApi
        .buscarProductos(idCategoria, busqueda.trim())
        .then(setProductos)
        .catch(setError);
    }, 300);

    return () => clearTimeout(espera);
  }, [idCategoria, busqueda]);

  const nombreCategoria = (id: number) =>
    categorias.find((c) => c.id === id)?.nombre ?? "";

  return (
    <div className="catalogo">

      {/* Encabezado */}
      <section className="catalogo-hero">
        <div>
          <span className="hero-etiqueta">KAIRÓS · CATÁLOGO</span>

          <h1>
            Encuentra lo que
            <span> necesitas</span>
          </h1>

          <p>
            Explora nuestro catálogo de productos y encuentra
            exactamente lo que estás buscando.
          </p>
        </div>
      </section>

      <Mensaje tipo="error" error={error} />

      {/* Filtros */}
      <section className="catalogo-filtros">
        <div className="filtro-busqueda">
          <span className="filtro-icono">⌕</span>

          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          value={idCategoria ?? ""}
          onChange={(e) =>
            setIdCategoria(
              e.target.value ? Number(e.target.value) : undefined
            )
          }
        >
          <option value="">Todas las categorías</option>

          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </section>

      {/* Información de resultados */}
      <div className="catalogo-resultados">
        <div>
          <h2>Productos</h2>
          <p>
            {productos.length}{" "}
            {productos.length === 1 ? "producto encontrado" : "productos encontrados"}
          </p>
        </div>

        {busqueda && (
          <button
            className="btn-limpiar"
            onClick={() => setBusqueda("")}
          >
            Limpiar búsqueda
          </button>
        )}
      </div>

      {/* Productos */}
      {productos.length === 0 ? (
        <div className="catalogo-vacio">
          <div className="vacio-icono">⌕</div>

          <h3>No encontramos productos</h3>

          <p>
            Intenta cambiar los filtros o utilizar otro término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grilla-productos">
          {productos.map((p) => (
            <article key={p.id} className="producto-card">

              <div className="producto-imagen">
                <span>KAIRÓS</span>
              </div>

              <div className="producto-contenido">
                <span className="producto-categoria">
                  {nombreCategoria(p.idCategoria)}
                </span>

                <h3>{p.nombre}</h3>

                <p className="producto-marca">
                  {p.marca}
                </p>

                <p className="producto-descripcion">
                  {p.descripcion}
                </p>

                <div className="producto-footer">
                  <span className="producto-precio">
                    {formatoPrecio.format(p.precio)}
                  </span>


                </div>
              </div>

            </article>
          ))}
        </div>
      )}
    </div>
  );
}
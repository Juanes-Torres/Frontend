// Marcador de carga (Figma: "Esqueleto"): mientras llegan los datos se mantienen
// la barra, los títulos y los encabezados; solo el contenido brilla.

interface Props {
  ancho?: number | string;
  alto?: number;
  forma?: "linea" | "titulo" | "bloque" | "circulo";
}

export default function Esqueleto({ ancho = "100%", alto, forma = "linea" }: Props) {
  const clase = forma === "linea" ? "esqueleto" : `esqueleto esqueleto-${forma}`;
  return <span className={clase} style={{ width: ancho, height: alto }} aria-hidden="true" />;
}

/**
 * Filas de una tabla que todavía está cargando.
 * La fila NO lleva aria-hidden: un <tr> cuenta como elemento enfocable (rol "row").
 * Cada esqueleto ya está oculto para lectores de pantalla desde su <span>.
 */
export function FilasCargando({ columnas, filas = 4 }: { columnas: number; filas?: number }) {
  return (
    <>
      {Array.from({ length: filas }, (_, f) => (
        <tr key={f}>
          {Array.from({ length: columnas }, (_, c) => (
            <td key={c}><Esqueleto ancho={c === 0 ? 28 : `${55 + ((f + c) % 3) * 15}%`} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

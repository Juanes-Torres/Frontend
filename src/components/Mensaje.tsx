// Muestra un mensaje de éxito o de error (incluye los errores por campo de la API)
import { ApiError } from "../api/client";

interface Props {
  tipo: "exito" | "error";
  texto?: string;
  error?: unknown;
}

export default function Mensaje({ tipo, texto, error }: Props) {
  if (!texto && !error) return null;

  let contenido = texto ?? "";
  let campos: Record<string, string> | null = null;
  if (error instanceof ApiError) {
    contenido = `${error.message}${error.status ? ` (HTTP ${error.status})` : ""}`;
    campos = error.campos;
  } else if (error instanceof Error) {
    contenido = error.message;
  }

  return (
    <div className={`mensaje mensaje-${tipo}`}>
      <p>{contenido}</p>
      {campos && (
        <ul>
          {Object.entries(campos).map(([campo, detalle]) => (
            <li key={campo}>
              <strong>{campo}:</strong> {detalle}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

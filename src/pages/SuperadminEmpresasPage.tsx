import { useCallback, useEffect, useState } from "react";
import { empresasApi } from "../api/empresas";
import type { AccionEmpresa } from "../api/empresas";
import Mensaje from "../components/Mensaje";
import type { Empresa, EstadoEmpresa } from "../types";

// Qué puede hacer el superadmin según el estado (las mismas reglas del backend)
const accionesPorEstado: Record<EstadoEmpresa, { accion: AccionEmpresa; texto: string; clase: string }[]> = {
  PENDIENTE: [
    { accion: "aprobar", texto: "Aprobar", clase: "" },
    { accion: "rechazar", texto: "Rechazar", clase: "btn-peligro" },
  ],
  ACTIVA: [{ accion: "suspender", texto: "Suspender", clase: "btn-peligro" }],
  SUSPENDIDA: [{ accion: "reactivar", texto: "Reactivar", clase: "btn-secundario" }],
  RECHAZADA: [],
};

const resultado: Record<AccionEmpresa, string> = {
  aprobar: "aprobada",
  rechazar: "rechazada",
  suspender: "suspendida",
  reactivar: "reactivada",
};

const nombreEstado: Record<EstadoEmpresa, string> = {
  PENDIENTE: "Pendiente",
  ACTIVA: "Activa",
  RECHAZADA: "Rechazada",
  SUSPENDIDA: "Suspendida",
};

export default function SuperadminEmpresasPage() {
  const [estado, setEstado] = useState<EstadoEmpresa | "">("PENDIENTE");
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [exito, setExito] = useState("");

  const cargar = useCallback(() => {
    empresasApi.listar(estado || undefined).then(setEmpresas).catch(setError);
  }, [estado]);

  useEffect(cargar, [cargar]);

  const cambiarEstado = async (empresa: Empresa, accion: AccionEmpresa) => {
    if (!window.confirm(`¿Seguro que quiere ${accion} la empresa "${empresa.nombre}"?`)) return;
    setError(null);
    setExito("");
    try {
      await empresasApi.cambiarEstado(empresa.id, accion);             // PATCH /api/empresas/{id}/{accion}
      setExito(`Empresa "${empresa.nombre}" ${resultado[accion]}`);
      cargar();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="pagina">
      <h2>Empresas de la plataforma</h2>
      <p className="texto-ayuda">
        Las empresas nuevas quedan pendientes. Sus empleados solo pueden iniciar sesión cuando la empresa está activa.
      </p>
      <Mensaje tipo="exito" texto={exito} />
      <Mensaje tipo="error" error={error} />

      <div className="filtros">
        <label>
          Estado{" "}
          <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoEmpresa | "")}>
            <option value="">Todas</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="ACTIVA">Activas</option>
            <option value="SUSPENDIDA">Suspendidas</option>
            <option value="RECHAZADA">Rechazadas</option>
          </select>
        </label>
      </div>

      <table>
        <thead>
          <tr><th>Empresa</th><th>NIT</th><th>Email</th><th>Teléfono</th><th>Registro</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          {empresas.map((e) => (
            <tr key={e.id}>
              <td>{e.nombre}</td>
              <td>{e.nit}</td>
              <td>{e.email}</td>
              <td>{e.telefono ?? "—"}</td>
              <td>{e.fechaRegistro}</td>
              <td>
                <span className={e.estado === "ACTIVA" ? "etiqueta" : "etiqueta etiqueta-alerta"}>
                  {nombreEstado[e.estado]}
                </span>
              </td>
              <td className="acciones">
                {accionesPorEstado[e.estado].map(({ accion, texto, clase }) => (
                  <button key={accion} className={clase} onClick={() => cambiarEstado(e, accion)}>{texto}</button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {empresas.length === 0 && <p>No hay empresas en este estado.</p>}
    </div>
  );
}

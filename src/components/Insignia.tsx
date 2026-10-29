// Insignia del sistema de diseño (Figma: "Insignia"): estados en píldora y roles en azul
import type { EstadoEmpresa, Rol } from "../types";

export type TipoInsignia =
  | "Activo" | "Inactivo"
  | "Disponible" | "Bajo stock" | "Sin stock"
  | "Pendiente" | "Activa" | "Rechazada" | "Suspendida"
  | "Completada";

// Color de cada tipo, igual que en Figma
const clase: Record<TipoInsignia, string> = {
  Activo: "",
  Activa: "",
  Disponible: "",
  Completada: "",
  Inactivo: "insignia-inactivo",
  "Bajo stock": "insignia-alerta",
  "Sin stock": "insignia-error",
  Rechazada: "insignia-error",
  Pendiente: "insignia-info",
  Suspendida: "insignia-suspendida",
};

export default function Insignia({ tipo }: { tipo: TipoInsignia }) {
  return <span className={`insignia ${clase[tipo]}`.trim()}>{tipo}</span>;
}

/** Roles: azul y en mayúsculas (CLIENTE, VENDEDOR, ADMINISTRADOR, SUPERADMIN). */
export function InsigniaRol({ rol }: { rol: Rol }) {
  return <span className="insignia insignia-rol">{rol}</span>;
}

const nombreEstadoEmpresa: Record<EstadoEmpresa, TipoInsignia> = {
  PENDIENTE: "Pendiente",
  ACTIVA: "Activa",
  RECHAZADA: "Rechazada",
  SUSPENDIDA: "Suspendida",
};

export function InsigniaEmpresa({ estado }: { estado: EstadoEmpresa }) {
  return <Insignia tipo={nombreEstadoEmpresa[estado]} />;
}

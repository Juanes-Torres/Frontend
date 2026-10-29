// Tipos que representan el JSON que devuelve la API de KAIRÓS

// SUPERADMIN administra la plataforma (aprueba empresas); no pertenece a ninguna empresa
export type Rol = "CLIENTE" | "VENDEDOR" | "ADMINISTRADOR" | "SUPERADMIN";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  telefono: string | null;
  idAlmacen: number | null;
  idEmpresa: number | null;   // null para clientes y superadmin
  fechaRegistro: string;
  activo: boolean;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  usuario: Usuario;
  empresa: Empresa | null;    // la empresa del empleado; null para clientes y superadmin
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  marca: string | null;
  idCategoria: number;
  idEmpresa: number;
}

export interface ProductoRequest {
  nombre: string;
  descripcion: string;
  precio: number;
  marca: string;
  idCategoria: number;
}

export interface Almacen {
  id: number;
  nombre: string;
  ciudad: string;
  direccion: string | null;
  estado: "ACTIVO" | "INACTIVO";
  idEmpresa: number;
}

export interface Inventario {
  id: number;
  idProducto: number;
  producto: string;
  idAlmacen: number;
  almacen: string;
  cantidadDisponible: number;
  stockMinimo: number;
  bajoStock: boolean;
}

export type TipoMovimiento = "ENTRADA" | "SALIDA";

export type EstadoEmpresa = "PENDIENTE" | "ACTIVA" | "RECHAZADA" | "SUSPENDIDA";

export interface Empresa {
  id: number;
  nombre: string;
  nit: string;
  email: string;
  telefono: string | null;
  estado: EstadoEmpresa;
  fechaRegistro: string;
}

/** Lo que el catálogo público sabe de una empresa activa */
export interface EmpresaPublica {
  id: number;
  nombre: string;
  telefono: string | null;
}

/** Sugerencia de datos de un producto a partir de su código de barras (API externa) */
export interface DatosCodigoBarras {
  codigoBarras: string;
  nombre: string | null;
  marca: string | null;
  descripcion: string | null;
  categoriaSugerida: string | null;
  fuente: string;
}

export interface LineaVenta {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  numeroFactura: string;
  fecha: string;
  idAlmacen: number;
  idVendedor: number;
  idCliente: number | null;
  estado: "COMPLETADA" | "ANULADA";
  total: number;
  detalles: LineaVenta[];
}

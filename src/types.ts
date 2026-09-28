// Tipos que representan el JSON que devuelve la API de KAIRÓS

export type Rol = "CLIENTE" | "VENDEDOR" | "ADMINISTRADOR";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  telefono: string | null;
  idAlmacen: number | null;
  fechaRegistro: string;
  activo: boolean;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  usuario: Usuario;
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

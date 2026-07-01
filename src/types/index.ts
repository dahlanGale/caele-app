export type Pyme = {
  id: string;
  nombre?: string;
  email: string;
  nombreNegocio?: string;
  celular?: string;
  isAdmin?: boolean;
  fechaRegistro?: Date;
};

export type Categoria = {
  id: string;
  nombre: string;
  productos?: number;
  activa: boolean;
  orden?: number;
};

export type Insumo = {
  id: string;
  nombre: string;
  unidad: 'kg' | 'g' | 'l' | 'ml' | 'pz' | 'caja';
  stock: number;
  costo: number;
};

export type Producto = {
  id: string;
  nombre: string;
  descripcion?: string;
  categoriaId?: string;
  precio: number;
  imagen?: string;
  activo?: boolean;
  stock?: number;
  ingredientes?: { insumoId: string; cantidad: number }[];
};

export type Mesa = {
  id: string;
  x: number;
  y: number;
  label?: string;
  shape?: 'circle' | 'rect';
  capacidad?: number;
  estado?: 'libre' | 'ocupada' | 'cuenta';
};

export type LayoutMesas = {
  id: string;
  nombre: string;
  mesas: Mesa[];
};

export type ItemOrden = {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  nombre: string;
};

export type Orden = {
  id: string;
  mesaId?: string;
  items: ItemOrden[];
  subtotal: number;
  impuestos: number;
  total: number;
  estado: 'abierta' | 'pagada' | 'cancelada';
  createdAt: Date;
  updatedAt: Date;
};

export type Usuario = {
  uid: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  rol?: 'admin' | 'cajero' | 'mesero';
  pymeId?: string;
};

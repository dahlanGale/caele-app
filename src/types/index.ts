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

// --- Módulo de mesas (rediseño: zonas + elementos en grid lógico) ---

export type TipoDistribucion =
  | 'restaurante'
  | 'cafeteria'
  | 'bar'
  | 'terraza'
  | 'banquete'
  | 'personalizado';

export type ElementoForma = 'redonda' | 'cuadrada' | 'rectangular' | 'barra';
export type ElementoTipo = 'mesa' | 'entrada' | 'decoracion' | 'texto';
export type ElementoEstado = 'disponible' | 'ocupada' | 'reservada' | 'cuenta';

export type Piso = {
  id: string;
  nombre: string;
  orden: number;
};

export type Zona = {
  id: string;
  nombre: string;
  piso: string;
  orden: number;
  activa?: boolean;
};

export type Elemento = {
  id: string;
  tipo: ElementoTipo;
  forma?: ElementoForma; // solo aplica cuando tipo === 'mesa'
  nombre: string; // ej. "Mesa 1", "Barra", o texto libre
  capacidad?: number;
  fila: number;
  columna: number;
  ancho?: number; // colspan lógico (barras/rectangulares largas)
  estado?: ElementoEstado; // solo aplica cuando tipo === 'mesa'
};

export type ZonaConElementos = Zona & { elementos: Elemento[] };

// Configuración de la mesa por zona usada durante el wizard
export type ConfiguracionZona = {
  nombre: string;
  piso: string;
  cantidadMesas: number;
  forma: ElementoForma;
  capacidad: number;
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

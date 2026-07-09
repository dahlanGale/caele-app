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



// --- Artículos (catálogo POS) ---

export type Articulo = {
  id: string;
  nombre: string;
  descripcion?: string;
  categoriaId?: string;
  precio: number; // IVA incluido
  descuento?: number; // porcentaje 0-100
  imagen?: string;
  stock?: number;
  codigoBarras?: string; // UPC / código de barras para escaneo
  unidadVenta?: string; // ej. 'pz', 'kg'
  activo?: boolean;
  fechaRegistro?: Date;
};

// --- Orden / venta ---

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'pendiente';

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
  metodoPago?: MetodoPago;
  montoRecibido?: number;
  cambio?: number;
  terminalId?: string;
  corteId?: string;
  codigoVenta?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Datos de pago capturados en el ModalPago
export type PaymentData = {
  metodoPago: MetodoPago;
  montoRecibido?: number;
  cambio?: number;
};

// --- Registro de máquina / terminal ---

export type TipoMaquina = 'punto_de_venta' | 'administrativo';

export type DeviceInfo = {
  machineId: string;
  modelo?: string;
  marca?: string;
  so?: string; // sistema operativo
  installationId?: string;
};

export type SesionTerminal = {
  fechaInicio: Date;
  activa: boolean;
  usuarioNombre?: string;
};

export type Terminal = {
  id: string; // = machineId
  nombreEquipo: string;
  tipoMaquina: TipoMaquina;
  device: DeviceInfo;
  usuarioRegistro?: { uid: string; email?: string };
  activa: boolean;
  fechaRegistro?: Date;
  ultimaSesion?: Date;
  logSesion?: Record<string, SesionTerminal>;
};

// --- Cortes de caja ---

export type RetiroCaja = {
  id: string;
  monto: number;
  motivo: string;
  fecha: Date;
};

export type EstatusCorte = 'Activo' | 'Cerrado' | 'Pendiente';

export type CorteTotales = {
  efectivo: number;
  tarjeta: number;
  transferencia: number;
  pendiente: number;
  ventas: number;
  retiros: number;
};

export type Corte = {
  id: string;
  usuarioId: string;
  usuarioNombre?: string;
  terminalId: string;
  fechaInicio: Date;
  fechaCierre?: Date;
  efectivoInicial: number; // fondo de caja
  totales: CorteTotales;
  ventas: { id: string; hora: Date; metodoPago: MetodoPago; monto: number }[];
  retiros: RetiroCaja[];
  estatus: EstatusCorte;
  efectivoEsperado?: number;
  efectivoFinal?: number;
  diferencia?: number;
  observaciones?: string;
};

export type Usuario = {
  uid: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  rol?: 'admin' | 'cajero' | 'mesero';
  pymeId?: string;
};

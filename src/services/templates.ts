import type { ConfiguracionZona, TipoDistribucion } from '@/src/types';

export type Plantilla = {
  key: string;
  tipo: TipoDistribucion;
  nombre: string;
  descripcion: string;
  zonas: ConfiguracionZona[];
};

export const TIPOS_DISTRIBUCION: {
  key: TipoDistribucion;
  label: string;
  descripcion: string;
}[] = [
  { key: 'restaurante', label: 'Restaurante', descripcion: 'Mesas con zonas tradicionales: interior, terraza, barra.' },
  { key: 'cafeteria', label: 'Cafetería', descripcion: 'Mesas pequeñas y altas, barra de café.' },
  { key: 'bar', label: 'Bar', descripcion: 'Barra larga, mesas altas y banquetas.' },
  { key: 'terraza', label: 'Terraza', descripcion: 'Mesas al aire libre con capacidad variable.' },
  { key: 'banquete', label: 'Banquete', descripcion: 'Mesas largas para eventos y grupos grandes.' },
  { key: 'personalizado', label: 'Personalizado', descripcion: 'Empieza en blanco y crea tus propias zonas.' },
];

export const PLANTILLAS: Plantilla[] = [
  {
    key: 'pequeno',
    tipo: 'restaurante',
    nombre: 'Restaurante pequeño',
    descripcion: '8 mesas en interior y 4 en terraza.',
    zonas: [
      { nombre: 'Interior', cantidadMesas: 8, forma: 'redonda', capacidad: 4 },
      { nombre: 'Terraza', cantidadMesas: 4, forma: 'redonda', capacidad: 4 },
    ],
  },
  {
    key: 'mediano',
    tipo: 'restaurante',
    nombre: 'Restaurante mediano',
    descripcion: '12 mesas en interior, 6 en terraza y 4 en barra.',
    zonas: [
      { nombre: 'Interior', cantidadMesas: 12, forma: 'redonda', capacidad: 4 },
      { nombre: 'Terraza', cantidadMesas: 6, forma: 'redonda', capacidad: 4 },
      { nombre: 'Barra', cantidadMesas: 4, forma: 'barra', capacidad: 2 },
    ],
  },
  {
    key: 'grande',
    tipo: 'restaurante',
    nombre: 'Restaurante grande',
    descripcion: '20 mesas en salón principal, 8 en terraza y 8 VIP.',
    zonas: [
      { nombre: 'Salón principal', cantidadMesas: 20, forma: 'redonda', capacidad: 6 },
      { nombre: 'Terraza', cantidadMesas: 8, forma: 'redonda', capacidad: 6 },
      { nombre: 'VIP', cantidadMesas: 8, forma: 'redonda', capacidad: 4 },
    ],
  },
  {
    key: 'cafeteria',
    tipo: 'cafeteria',
    nombre: 'Cafetería',
    descripcion: 'Mesas pequeñas, barra de café y mesones altos.',
    zonas: [
      { nombre: 'Salón', cantidadMesas: 8, forma: 'cuadrada', capacidad: 2 },
      { nombre: 'Barra', cantidadMesas: 6, forma: 'barra', capacidad: 1 },
      { nombre: 'Mesones altos', cantidadMesas: 4, forma: 'redonda', capacidad: 2 },
    ],
  },
  {
    key: 'bar',
    tipo: 'bar',
    nombre: 'Bar',
    descripcion: 'Barra central, mesas altas y terraza.',
    zonas: [
      { nombre: 'Barra', cantidadMesas: 8, forma: 'barra', capacidad: 2 },
      { nombre: 'Mesas altas', cantidadMesas: 6, forma: 'redonda', capacidad: 2 },
      { nombre: 'Terraza', cantidadMesas: 4, forma: 'redonda', capacidad: 4 },
    ],
  },
  {
    key: 'terraza',
    tipo: 'terraza',
    nombre: 'Terraza',
    descripcion: 'Mesas al aire libre con barra y zona lounge.',
    zonas: [
      { nombre: 'Terraza principal', cantidadMesas: 10, forma: 'redonda', capacidad: 4 },
      { nombre: 'Barra exterior', cantidadMesas: 4, forma: 'barra', capacidad: 2 },
      { nombre: 'Lounge', cantidadMesas: 4, forma: 'rectangular', capacidad: 8 },
    ],
  },
  {
    key: 'banquete',
    tipo: 'banquete',
    nombre: 'Banquete',
    descripcion: 'Mesas largas para eventos y grupos grandes.',
    zonas: [
      { nombre: 'Salón A', cantidadMesas: 5, forma: 'rectangular', capacidad: 10 },
      { nombre: 'Salón B', cantidadMesas: 5, forma: 'rectangular', capacidad: 10 },
      { nombre: 'VIP', cantidadMesas: 3, forma: 'rectangular', capacidad: 12 },
    ],
  },
  {
    key: 'personalizado',
    tipo: 'personalizado',
    nombre: 'Personalizado',
    descripcion: 'Sin mesas predefinidas. Las agregarás en el editor.',
    zonas: [],
  },
];

export function plantillasPorTipo(tipo: TipoDistribucion): Plantilla[] {
  return PLANTILLAS.filter((p) => p.tipo === tipo);
}

export function obtenerPlantilla(key: string): Plantilla | undefined {
  return PLANTILLAS.find((p) => p.key === key);
}

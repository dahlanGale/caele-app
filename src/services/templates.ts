import type { ConfiguracionZona, ElementoForma, TipoDistribucion } from '@/src/types';

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

const DEFAULT_PISO = 'Piso 1';

function zona(
  nombre: string,
  cantidadMesas: number,
  forma: ElementoForma,
  capacidad: number,
  piso = DEFAULT_PISO
): ConfiguracionZona {
  return { nombre, piso, cantidadMesas, forma, capacidad };
}

export const PLANTILLAS: Plantilla[] = [
  {
    key: 'pequeno',
    tipo: 'restaurante',
    nombre: 'Restaurante pequeño',
    descripcion: '8 mesas en interior y 4 en terraza.',
    zonas: [
      zona('Interior', 8, 'redonda', 4),
      zona('Terraza', 4, 'redonda', 4),
    ],
  },
  {
    key: 'mediano',
    tipo: 'restaurante',
    nombre: 'Restaurante mediano',
    descripcion: '12 mesas en interior, 6 en terraza y 4 en barra.',
    zonas: [
      zona('Interior', 12, 'redonda', 4),
      zona('Terraza', 6, 'redonda', 4),
      zona('Barra', 4, 'barra', 2),
    ],
  },
  {
    key: 'grande',
    tipo: 'restaurante',
    nombre: 'Restaurante grande',
    descripcion: '20 mesas en salón principal, 8 en terraza y 8 VIP.',
    zonas: [
      zona('Salón principal', 20, 'redonda', 6),
      zona('Terraza', 8, 'redonda', 6),
      zona('VIP', 8, 'redonda', 4),
    ],
  },
  {
    key: 'cafeteria',
    tipo: 'cafeteria',
    nombre: 'Cafetería',
    descripcion: 'Mesas pequeñas, barra de café y mesones altos.',
    zonas: [
      zona('Salón', 8, 'cuadrada', 2),
      zona('Barra', 6, 'barra', 1),
      zona('Mesones altos', 4, 'redonda', 2),
    ],
  },
  {
    key: 'bar',
    tipo: 'bar',
    nombre: 'Bar',
    descripcion: 'Barra central, mesas altas y terraza.',
    zonas: [
      zona('Barra', 8, 'barra', 2),
      zona('Mesas altas', 6, 'redonda', 2),
      zona('Terraza', 4, 'redonda', 4),
    ],
  },
  {
    key: 'terraza',
    tipo: 'terraza',
    nombre: 'Terraza',
    descripcion: 'Mesas al aire libre con barra y zona lounge.',
    zonas: [
      zona('Terraza principal', 10, 'redonda', 4),
      zona('Barra exterior', 4, 'barra', 2),
      zona('Lounge', 4, 'rectangular', 8),
    ],
  },
  {
    key: 'banquete',
    tipo: 'banquete',
    nombre: 'Banquete',
    descripcion: 'Mesas largas para eventos y grupos grandes.',
    zonas: [
      zona('Salón A', 5, 'rectangular', 10),
      zona('Salón B', 5, 'rectangular', 10),
      zona('VIP', 3, 'rectangular', 12),
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

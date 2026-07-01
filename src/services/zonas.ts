import { TypedCollection } from './firestore';

import { firestore } from '@/src/lib/firebase';
import type { ConfiguracionZona, Elemento, ElementoEstado, ElementoForma, Zona } from '@/src/types';

export const zonasCollection = new TypedCollection<Zona>(
  firestore,
  (pymeId) => `pymes/${pymeId}/zonas`
);

export function elementosCollection(pymeId: string, zonaId: string) {
  return new TypedCollection<Elemento>(
    firestore,
    () => `pymes/${pymeId}/zonas/${zonaId}/elementos`
  );
}

export function generarElementos(
  cantidad: number,
  forma: ElementoForma,
  capacidad: number,
  prefix = 'M',
  startIndex = 1
): Elemento[] {
  const elementos: Elemento[] = [];
  let col = 0;
  let fila = 0;
  for (let i = 0; i < cantidad; i++) {
    const id = Math.random().toString(36).slice(2);
    const ancho = forma === 'rectangular' ? 2 : forma === 'barra' ? 3 : 1;
    elementos.push({
      id,
      tipo: 'mesa',
      forma,
      nombre: `${prefix}${startIndex + i}`,
      capacidad,
      fila,
      columna: col,
      ancho,
      estado: 'disponible',
    });
    col += ancho;
    if (col >= 6) {
      col = 0;
      fila++;
    }
  }
  return elementos;
}

export async function crearZona(
  pymeId: string,
  nombre: string,
  piso: string,
  orden: number,
  configuracion?: ConfiguracionZona
): Promise<{ zonaId: string; elementos: Elemento[] }> {
  const zonaId = await zonasCollection.create(pymeId, {
    nombre,
    piso,
    orden,
    activa: true,
  });
  const elementos: Elemento[] = configuracion
    ? generarElementos(
        configuracion.cantidadMesas,
        configuracion.forma,
        configuracion.capacidad,
        nombre.slice(0, 1).toUpperCase(),
        1
      )
    : [];
  const repo = elementosCollection(pymeId, zonaId);
  await Promise.all(elementos.map((el) => repo.create(pymeId, el)));
  return { zonaId, elementos };
}

export async function eliminarZona(pymeId: string, zonaId: string): Promise<void> {
  const repo = elementosCollection(pymeId, zonaId);
  const elementos = await repo.list(pymeId);
  await Promise.all(elementos.map((el) => repo.delete(pymeId, el.id)));
  await zonasCollection.delete(pymeId, zonaId);
}

export async function actualizarEstadoElemento(
  pymeId: string,
  zonaId: string,
  elementoId: string,
  estado: ElementoEstado
): Promise<void> {
  await elementosCollection(pymeId, zonaId).update(pymeId, elementoId, { estado });
}

export async function reordenarElementos(
  pymeId: string,
  zonaId: string,
  elementos: Elemento[]
): Promise<void> {
  const repo = elementosCollection(pymeId, zonaId);
  await Promise.all(
    elementos.map((el) =>
      repo.set(pymeId, el.id, {
        tipo: el.tipo,
        forma: el.forma,
        nombre: el.nombre,
        capacidad: el.capacidad,
        fila: el.fila,
        columna: el.columna,
        ancho: el.ancho,
        estado: el.estado,
      })
    )
  );
}

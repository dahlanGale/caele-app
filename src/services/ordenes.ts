import { ordenesCollection } from './firestore';
import { actualizarEstadoElemento } from './zonas';

import type { ElementoEstado, ItemOrden, Orden } from '@/src/types';

export function calcularTotales(items: ItemOrden[]) {
  const subtotal = items.reduce((acc, it) => acc + it.precioUnitario * it.cantidad, 0);
  const impuestos = subtotal * 0.06; // IVA ejemplo
  const total = subtotal + impuestos;
  return { subtotal, impuestos, total };
}

export async function crearOrden(
  pymeId: string,
  zonaId: string,
  elementoId: string,
  items: ItemOrden[]
): Promise<Orden> {
  const { subtotal, impuestos, total } = calcularTotales(items);
  const now = new Date();
  const orden: Omit<Orden, 'id'> = {
    mesaId: elementoId,
    items,
    subtotal,
    impuestos,
    total,
    estado: 'abierta',
    createdAt: now,
    updatedAt: now,
  };

  const id = await ordenesCollection.create(pymeId, orden);
  return { id, ...orden };
}

export async function pagarOrden(
  pymeId: string,
  ordenId: string,
  zonaId: string,
  elementoId: string
): Promise<void> {
  await ordenesCollection.update(pymeId, ordenId, { estado: 'pagada', updatedAt: new Date() });
  await actualizarEstadoElemento(pymeId, zonaId, elementoId, 'disponible');
}

export async function ocuparMesa(
  pymeId: string,
  zonaId: string,
  elementoId: string,
  estado: ElementoEstado = 'ocupada'
): Promise<void> {
  await actualizarEstadoElemento(pymeId, zonaId, elementoId, estado);
}

export async function reabrirMesa(
  pymeId: string,
  zonaId: string,
  elementoId: string,
  estado: ElementoEstado = 'cuenta'
): Promise<void> {
  await actualizarEstadoElemento(pymeId, zonaId, elementoId, estado);
}

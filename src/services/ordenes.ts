import { layoutsCollection, ordenesCollection } from './firestore';

import type { ItemOrden, Mesa, Orden } from '@/src/types';

export function calcularTotales(items: ItemOrden[]) {
  const subtotal = items.reduce((acc, it) => acc + it.precioUnitario * it.cantidad, 0);
  const impuestos = subtotal * 0.06; // IVA ejemplo
  const total = subtotal + impuestos;
  return { subtotal, impuestos, total };
}

export async function crearOrden(
  pymeId: string,
  mesaId: string,
  items: ItemOrden[]
): Promise<Orden> {
  const { subtotal, impuestos, total } = calcularTotales(items);
  const now = new Date();
  const orden: Omit<Orden, 'id'> = {
    mesaId,
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
  layoutId: string,
  mesaId: string
): Promise<void> {
  await ordenesCollection.update(pymeId, ordenId, { estado: 'pagada', updatedAt: new Date() });

  const layout = await layoutsCollection.get(pymeId, layoutId);
  if (layout) {
    const mesas = ((layout.mesas as Mesa[]) ?? []).map((m) =>
      m.id === mesaId ? { ...m, estado: 'libre' as const } : m
    );
    await layoutsCollection.set(pymeId, layoutId, { nombre: layout.nombre, mesas });
  }
}

export async function ocuparMesa(
  pymeId: string,
  layoutId: string,
  mesaId: string
): Promise<void> {
  const layout = await layoutsCollection.get(pymeId, layoutId);
  if (!layout) return;
  const mesas = ((layout.mesas as Mesa[]) ?? []).map((m) =>
    m.id === mesaId ? { ...m, estado: 'ocupada' as const } : m
  );
  await layoutsCollection.set(pymeId, layoutId, { nombre: layout.nombre, mesas });
}

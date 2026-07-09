import { agregarVentaAlCorte } from './cortes';
import { ordenesCollection } from './firestore';
import { actualizarEstadoElemento } from './zonas';

import type { ElementoEstado, ItemOrden, Orden, PaymentData } from '@/src/types';

// IVA incluido en el precio (16%), igual que el POS de origen.
export const TASA_IVA = 0.16;

export function calcularTotales(items: ItemOrden[]) {
  // Los precios ya incluyen IVA: el total es la suma directa.
  const total = items.reduce((acc, it) => acc + it.precioUnitario * it.cantidad, 0);
  const subtotal = total / (1 + TASA_IVA);
  const impuestos = total - subtotal;
  return { subtotal, impuestos, total };
}

/** Genera un código de venta incremental tipo ORD001. */
export async function generarCodigoVenta(pymeId: string): Promise<string> {
  const ordenes = await ordenesCollection.list(pymeId);
  const n = ordenes.length + 1;
  return `ORD${String(n).padStart(3, '0')}`;
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

export type PagarOrdenOptions = {
  pago: PaymentData;
  total: number;
  corteId?: string;
  terminalId?: string;
  codigoVenta?: string;
  zonaId?: string;
  elementoId?: string;
};

/**
 * Marca la orden como pagada con su método de pago y, si hay un corte activo,
 * acumula la venta en él. Libera la mesa si se indican zona/elemento.
 */
export async function pagarOrden(
  pymeId: string,
  ordenId: string,
  opts: PagarOrdenOptions
): Promise<void> {
  const { pago, total, corteId, terminalId, codigoVenta, zonaId, elementoId } = opts;

  await ordenesCollection.update(pymeId, ordenId, {
    estado: pago.metodoPago === 'pendiente' ? 'abierta' : 'pagada',
    metodoPago: pago.metodoPago,
    montoRecibido: pago.montoRecibido ?? null,
    cambio: pago.cambio ?? null,
    terminalId: terminalId ?? null,
    corteId: corteId ?? null,
    codigoVenta: codigoVenta ?? null,
    updatedAt: new Date(),
  } as any);

  if (corteId) {
    await agregarVentaAlCorte(pymeId, corteId, {
      id: ordenId,
      metodoPago: pago.metodoPago,
      monto: total,
    });
  }

  if (zonaId && elementoId) {
    await actualizarEstadoElemento(pymeId, zonaId, elementoId, 'disponible');
  }
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

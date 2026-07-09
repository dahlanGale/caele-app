import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  query,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { firestore } from '@/src/lib/firebase';
import { cortesCollection } from './firestore';

import type { Corte, MetodoPago, RetiroCaja } from '@/src/types';

function cortesPath(pymeId: string) {
  return `pymes/${pymeId}/cortes`;
}

function corteRef(pymeId: string, corteId: string) {
  return doc(firestore, cortesPath(pymeId), corteId);
}

function emptyTotales() {
  return { efectivo: 0, tarjeta: 0, transferencia: 0, pendiente: 0, ventas: 0, retiros: 0 };
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDate(value: any): Date {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  return new Date(value);
}

/** Devuelve el corte Activo del día para esta terminal + usuario, o null. */
export async function getCorteActivo(
  pymeId: string,
  terminalId: string,
  usuarioId: string
): Promise<Corte | null> {
  const q = query(collection(firestore, cortesPath(pymeId)), where('terminalId', '==', terminalId));
  const snap = await getDocs(q);
  const now = new Date();
  const activo = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as object) }) as Corte)
    .find(
      (c) => c.estatus === 'Activo' && c.usuarioId === usuarioId && isSameDay(toDate(c.fechaInicio), now)
    );
  return activo ?? null;
}

/** Suscripción en tiempo real al corte activo del día para esta terminal + usuario. */
export function subscribeCorteActivo(
  pymeId: string,
  terminalId: string,
  usuarioId: string,
  callback: (corte: Corte | null) => void
): Unsubscribe {
  const q = query(collection(firestore, cortesPath(pymeId)), where('terminalId', '==', terminalId));
  return onSnapshot(q, (snap) => {
    const now = new Date();
    const activo = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as object) }) as Corte)
      .find(
        (c) => c.estatus === 'Activo' && c.usuarioId === usuarioId && isSameDay(toDate(c.fechaInicio), now)
      );
    callback(activo ?? null);
  });
}

/**
 * Abre un nuevo corte activo con un fondo de caja inicial.
 * Marca como "Pendiente" cualquier corte activo previo de esta terminal + usuario.
 */
export async function abrirCorte(
  pymeId: string,
  input: {
    terminalId: string;
    usuarioId: string;
    usuarioNombre?: string;
    efectivoInicial: number;
  }
): Promise<Corte> {
  // Cerrar como pendientes los cortes activos previos de esta terminal+usuario.
  const q = query(
    collection(firestore, cortesPath(pymeId)),
    where('terminalId', '==', input.terminalId)
  );
  const snap = await getDocs(q);
  await Promise.all(
    snap.docs
      .filter((d) => (d.data() as any).estatus === 'Activo' && (d.data() as any).usuarioId === input.usuarioId)
      .map((d) => updateDoc(d.ref, { estatus: 'Pendiente' }))
  );

  const data = {
    usuarioId: input.usuarioId,
    usuarioNombre: input.usuarioNombre,
    terminalId: input.terminalId,
    fechaInicio: new Date(),
    efectivoInicial: input.efectivoInicial,
    totales: emptyTotales(),
    ventas: [],
    retiros: [],
    estatus: 'Activo' as const,
  };
  const id = await cortesCollection.create(pymeId, data as any);
  return { id, ...(data as any) } as Corte;
}

/** Acumula una venta pagada en el corte (totales por método + registro). */
export async function agregarVentaAlCorte(
  pymeId: string,
  corteId: string,
  venta: { id: string; metodoPago: MetodoPago; monto: number }
): Promise<void> {
  await updateDoc(corteRef(pymeId, corteId), {
    ventas: arrayUnion({ id: venta.id, hora: new Date(), metodoPago: venta.metodoPago, monto: venta.monto }),
    'totales.ventas': increment(venta.monto),
    [`totales.${venta.metodoPago}`]: increment(venta.monto),
  });
}

/** Registra un retiro parcial de efectivo en el corte activo. */
export async function registrarRetiro(
  pymeId: string,
  corteId: string,
  monto: number,
  motivo: string
): Promise<RetiroCaja> {
  const retiro: RetiroCaja = { id: `RET${Date.now()}`, monto, motivo, fecha: new Date() };
  await updateDoc(corteRef(pymeId, corteId), {
    retiros: arrayUnion(retiro),
    'totales.retiros': increment(monto),
  });
  return retiro;
}

/** Cierra el corte: calcula efectivo esperado y diferencia. */
export async function cerrarCorte(
  pymeId: string,
  corte: Corte,
  efectivoFinal: number,
  observaciones?: string
): Promise<{ efectivoEsperado: number; diferencia: number }> {
  const efectivoEsperado = corte.efectivoInicial + corte.totales.efectivo - corte.totales.retiros;
  const diferencia = efectivoFinal - efectivoEsperado;
  await updateDoc(corteRef(pymeId, corte.id), {
    estatus: 'Cerrado',
    fechaCierre: new Date(),
    efectivoEsperado,
    efectivoFinal,
    diferencia,
    observaciones: observaciones ?? '',
  });
  return { efectivoEsperado, diferencia };
}

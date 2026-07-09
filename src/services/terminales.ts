import { terminalesCollection } from './firestore';

import type { DeviceInfo, Terminal, TipoMaquina } from '@/src/types';

/** Elimina recursivamente claves con valor `undefined` (Firestore las rechaza). */
function pruneUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => pruneUndefined(v)) as unknown as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = pruneUndefined(v);
    }
    return out as T;
  }
  return value;
}

export type RegistrarTerminalInput = {
  nombreEquipo: string;
  tipoMaquina: TipoMaquina;
  device: DeviceInfo;
  usuarioRegistro?: { uid: string; email?: string };
};

/** Registra (o actualiza) la terminal usando su machineId como id del documento. */
export async function registrarTerminal(
  pymeId: string,
  input: RegistrarTerminalInput
): Promise<Terminal> {
  const machineId = input.device.machineId;
  const data = {
    nombreEquipo: input.nombreEquipo,
    tipoMaquina: input.tipoMaquina,
    device: input.device as unknown as Record<string, unknown>,
    usuarioRegistro: input.usuarioRegistro,
    activa: true,
    fechaRegistro: new Date(),
  };
  await terminalesCollection.set(pymeId, machineId, pruneUndefined(data) as any);
  return { id: machineId, ...(data as any) } as Terminal;
}

/** Devuelve la terminal registrada para este machineId, o null si no existe. */
export async function verificarTerminal(
  pymeId: string,
  machineId: string
): Promise<Terminal | null> {
  const doc = await terminalesCollection.get(pymeId, machineId);
  return (doc as Terminal) ?? null;
}

/** Marca una nueva sesión activa en el log de la terminal. */
export async function abrirSesion(
  pymeId: string,
  machineId: string,
  usuarioNombre?: string
): Promise<string> {
  const sessionId = `S${Date.now()}`;
  await terminalesCollection.set(pymeId, machineId, pruneUndefined({
    ultimaSesion: new Date(),
    logSesion: {
      [sessionId]: { fechaInicio: new Date(), activa: true, usuarioNombre },
    },
  }) as any);
  return sessionId;
}

/** Cierra una sesión previamente abierta. */
export async function cerrarSesion(
  pymeId: string,
  machineId: string,
  sessionId: string
): Promise<void> {
  await terminalesCollection.set(pymeId, machineId, {
    logSesion: { [sessionId]: { activa: false } },
  } as any);
}

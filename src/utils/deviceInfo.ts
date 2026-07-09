import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import type { DeviceInfo } from '@/src/types';

const DEVICE_ID_KEY = '@device_id';

/** Genera un UUID v4 sin dependencias externas. */
function generateUuid(): string {
  // crypto.randomUUID disponible en web moderno; fallback manual en nativo.
  const globalCrypto = (globalThis as any)?.crypto;
  if (globalCrypto?.randomUUID) {
    try {
      return globalCrypto.randomUUID();
    } catch {
      // continúa al fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Identidad estable del dispositivo/terminal.
 * - Android: ANDROID_ID
 * - iOS: idForVendor
 * - Web/otros: UUID persistido en AsyncStorage
 * Siempre se cachea en AsyncStorage para que sea consistente entre sesiones.
 */
export async function getDeviceId(): Promise<string> {
  try {
    const cached = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (cached) return cached;
  } catch {
    // ignora errores de storage
  }

  let id: string | null = null;
  try {
    if (Platform.OS === 'android') {
      id = Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      id = await Application.getIosIdForVendorAsync();
    }
  } catch {
    id = null;
  }

  if (!id) id = generateUuid();

  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // ignora errores de storage
  }
  return id;
}

/** Información del dispositivo para registrar la terminal. */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const machineId = await getDeviceId();
  // Solo incluimos campos definidos: Firestore rechaza valores `undefined`.
  const info: DeviceInfo = { machineId, installationId: machineId };
  const modelo = Device.modelName ?? undefined;
  const marca = Device.brand ?? Device.manufacturer ?? undefined;
  const so = [Device.osName, Device.osVersion].filter(Boolean).join(' ') || Platform.OS;
  if (modelo) info.modelo = modelo;
  if (marca) info.marca = marca;
  if (so) info.so = so;
  return info;
}

import { useCallback, useEffect, useState } from 'react';

import { usePyme } from '@/src/context/PymeContext';
import { verificarTerminal } from '@/src/services/terminales';
import { getDeviceId } from '@/src/utils/deviceInfo';
import type { Terminal } from '@/src/types';

/**
 * Resuelve el machineId del dispositivo y verifica si la terminal está
 * registrada para la pyme actual. Expone `refresh` para re-verificar tras
 * el registro.
 */
export function useTerminal() {
  const { pyme, loading: pymeLoading } = usePyme();
  const pymeId = pyme?.id;
  const [machineId, setMachineId] = useState<string | null>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (pymeLoading) return;
    if (!pymeId) {
      setTerminal(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const id = await getDeviceId();
      setMachineId(id);
      const t = await verificarTerminal(pymeId, id);
      setTerminal(t);
    } catch {
      setTerminal(null);
    } finally {
      setLoading(false);
    }
  }, [pymeId, pymeLoading]);

  useEffect(() => {
    check();
  }, [check]);

  return { machineId, terminal, loading, refresh: check, pymeId };
}

import { useEffect, useState } from 'react';

import { useAuth } from '@/src/context/AuthContext';
import { usePyme } from '@/src/context/PymeContext';
import { subscribeCorteActivo } from '@/src/services/cortes';
import type { Corte } from '@/src/types';

/**
 * Suscribe en tiempo real al corte activo del día para una terminal y el
 * usuario autenticado. Devuelve `null` mientras no haya corte abierto.
 */
export function useCorteActivo(terminalId?: string | null) {
  const { pyme } = usePyme();
  const { user } = useAuth();
  const pymeId = pyme?.id;
  const usuarioId = user?.uid;
  const [corte, setCorte] = useState<Corte | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pymeId || !usuarioId || !terminalId) {
      setCorte(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeCorteActivo(pymeId, terminalId, usuarioId, (c) => {
      setCorte(c);
      setLoading(false);
    });
    return () => unsub();
  }, [pymeId, usuarioId, terminalId]);

  return { corte, loading };
}

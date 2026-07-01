import { useEffect, useMemo, useState } from 'react';

import { elementosCollection, zonasCollection } from '@/src/services/zonas';
import type { Elemento, ZonaConElementos } from '@/src/types';

export function useRestaurante(pymeId: string | undefined) {
  const [zonas, setZonas] = useState<ZonaConElementos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!pymeId) {
      setZonas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubZonas = zonasCollection.subscribe(pymeId, (items) => {
      const sorted = items
        .map((z) => ({ ...z, orden: z.orden ?? 0 }))
        .sort((a, b) => a.orden - b.orden);

      const unsubs: (() => void)[] = [];
      const zonaMap = new Map<string, ZonaConElementos>();
      const elementoMap = new Map<string, Elemento[]>();

      sorted.forEach((z) => {
        zonaMap.set(z.id, { ...z, elementos: [] });
        const unsub = elementosCollection(pymeId, z.id).subscribe(pymeId, (els) => {
          elementoMap.set(z.id, els);
          const next = sorted.map((z2) => ({
            ...z2,
            elementos: elementoMap.get(z2.id) ?? [],
          }));
          setZonas(next);
        });
        unsubs.push(unsub);
      });

      setZonas(sorted.map((z) => ({ ...z, elementos: elementoMap.get(z.id) ?? [] })));
      setLoading(false);

      return () => {
        unsubs.forEach((fn) => fn());
      };
    });

    return () => {
      unsubZonas();
    };
  }, [pymeId]);

  const estadisticas = useMemo(() => {
    const mesas = zonas.flatMap((z) => z.elementos.filter((e) => e.tipo === 'mesa'));
    const total = mesas.length;
    const ocupadas = mesas.filter((m) => m.estado === 'ocupada').length;
    const cuentas = mesas.filter((m) => m.estado === 'cuenta').length;
    const reservadas = mesas.filter((m) => m.estado === 'reservada').length;
    const disponibles = total - ocupadas - cuentas - reservadas;
    return { total, disponibles, ocupadas, cuentas, reservadas };
  }, [zonas]);

  return { zonas, estadisticas, loading, error };
}

import { useEffect, useState } from 'react';

import type { Unsubscribe } from 'firebase/firestore';

import { usePyme } from '@/src/context/PymeContext';
import type { TypedCollection, WithId } from '@/src/services/firestore';

export function useFirestoreCollection<T extends object>(collection: TypedCollection<T>) {
  const { pyme, loading: pymeLoading } = usePyme();
  const pymeId = pyme?.id;
  const [items, setItems] = useState<WithId<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pymeLoading) return;
    if (!pymeId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let unsub: Unsubscribe | undefined;
    try {
      setLoading(true);
      unsub = collection.subscribe(pymeId, (data) => {
        setItems(data);
        setLoading(false);
      });
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar datos');
      setLoading(false);
    }

    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pymeId, pymeLoading]);

  return { items, loading, error, pymeId };
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/src/context/AuthContext';
import { pymeCollection } from '@/src/services/firestore';
import type { Pyme } from '@/src/types';

type PymeState = {
  pyme: Pyme | null;
  loading: boolean;
};

const PymeContext = createContext<PymeState>({ pyme: null, loading: true });

export function PymeProvider({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  const [pyme, setPyme] = useState<Pyme | null>(null);
  const [loading, setLoading] = useState(true);

  const uid = user?.uid;

  useEffect(() => {
    if (initializing) return;
    if (!uid) {
      setPyme(null);
      setLoading(false);
      return;
    }

    pymeCollection
      .get('', uid)
      .then(async (doc) => {
        if (doc) {
          setPyme(doc as Pyme);
          setLoading(false);
          return;
        }
        // Si no existe la pyme (por ejemplo, fue borrada), la recreamos automáticamente.
        const defaultPyme: Omit<Pyme, 'id'> = {
          email: user?.email ?? '',
          nombre: user?.displayName ?? '',
        };
        try {
          await pymeCollection.set('', uid, defaultPyme);
          setPyme({ id: uid, ...defaultPyme });
        } catch {
          setPyme(null);
        } finally {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [uid, initializing]);

  return <PymeContext.Provider value={useMemo(() => ({ pyme, loading }), [pyme, loading])}>{children}</PymeContext.Provider>;
}

export function usePyme() {
  const value = useContext(PymeContext);
  if (!value) {
    throw new Error('usePyme must be used within a PymeProvider');
  }
  return value;
}

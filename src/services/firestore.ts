import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    where,
    type CollectionReference,
    type DocumentData,
    type Firestore,
    type Query,
    type QueryDocumentSnapshot,
    type QuerySnapshot,
    type Unsubscribe,
} from 'firebase/firestore';

import { firestore } from '@/src/lib/firebase';

export type WithId<T> = T & { id: string };

export function withId<T extends object>(doc: DocumentData): WithId<T> {
  const { id, ...data } = doc;
  return { id: doc.id as string, ...data } as WithId<T>;
}

export function makeConverter<T extends object>() {
  return {
    toFirestore: (data: T): DocumentData => {
      const clone = { ...data } as any;
      delete clone.id;
      return clone;
    },
    fromFirestore: (snap: any): WithId<T> => ({
      id: snap.id,
      ...snap.data(),
    }),
  };
}

export class TypedCollection<T extends object> {
  constructor(
    private readonly db: Firestore,
    private readonly path: (pymeId: string) => string
  ) {}

  private ref(pymeId: string): CollectionReference<T, DocumentData> {
    return collection(this.db, this.path(pymeId)) as any;
  }

  private docRef(pymeId: string, id: string) {
    return doc(this.db, this.path(pymeId), id);
  }

  subscribe(pymeId: string, callback: (items: WithId<T>[]) => void): Unsubscribe {
    const q = query(this.ref(pymeId));
    return onSnapshot(
      q as any,
      (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
        const items = snapshot.docs.map((d: QueryDocumentSnapshot<DocumentData, DocumentData>) =>
          ({ id: d.id, ...(d.data() as object) }) as WithId<T>
        );
        callback(items);
      }
    );
  }

  async list(pymeId: string): Promise<WithId<T>[]> {
    const snapshot = await getDocs(this.ref(pymeId) as any);
    return snapshot.docs.map((d: QueryDocumentSnapshot<unknown, DocumentData>) =>
      ({ id: d.id, ...(d.data() as object) }) as WithId<T>
    );
  }

  async get(pymeId: string, id: string): Promise<WithId<T> | null> {
    const snap = await getDoc(this.docRef(pymeId, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as object) } as WithId<T>;
  }

  async create(pymeId: string, data: Omit<T, 'id'>): Promise<string> {
    const docRef = await addDoc(this.ref(pymeId) as any, data as any);
    return docRef.id;
  }

  async set(pymeId: string, id: string, data: Partial<T>): Promise<void> {
    const ref = this.docRef(pymeId, id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, data as any);
    } else {
      await setDoc(ref, data as any);
    }
  }

  async update(pymeId: string, id: string, data: Partial<T>): Promise<void> {
    await updateDoc(this.docRef(pymeId, id), data as any);
  }

  async delete(pymeId: string, id: string): Promise<void> {
    await deleteDoc(this.docRef(pymeId, id));
  }

  queryBy(pymeId: string, field: keyof T, value: unknown): Query<T, DocumentData> {
    return query(this.ref(pymeId), where(field as string, '==', value)) as any;
  }
}

export const pymeCollection = new TypedCollection<{
  email: string;
  nombre?: string;
  nombreNegocio?: string;
  celular?: string;
  isAdmin?: boolean;
  fechaRegistro?: Date;
}>(firestore, () => 'pymes');

export const categoriasCollection = new TypedCollection<{
  nombre: string;
  productos?: number;
  activa: boolean;
  orden?: number;
}>(firestore, (pymeId) => `pymes/${pymeId}/categorias`);

export const insumosCollection = new TypedCollection<{
  nombre: string;
  unidad: string;
  stock: number;
  costo: number;
}>(firestore, (pymeId) => `pymes/${pymeId}/insumos`);

export const productosCollection = new TypedCollection<{
  nombre: string;
  descripcion?: string;
  categoriaId?: string;
  precio: number;
  imagen?: string;
  activo?: boolean;
  stock?: number;
}>(firestore, (pymeId) => `pymes/${pymeId}/productos`);

export const usuariosCollection = new TypedCollection<{
  nombre?: string;
  email?: string;
  telefono?: string;
  rol?: string;
  pymeId?: string;
}>(firestore, () => 'usuarios');

export const ordenesCollection = new TypedCollection<{
  mesaId?: string;
  items: any[];
  subtotal: number;
  impuestos: number;
  total: number;
  estado: string;
  createdAt: Date;
  updatedAt: Date;
}>(firestore, (pymeId) => `pymes/${pymeId}/ordenes`);

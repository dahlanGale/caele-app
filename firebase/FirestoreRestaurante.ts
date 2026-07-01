import { auth } from '@/src/lib/firebase';
import { layoutsCollection } from '@/src/services/firestore';

class FirestoreRestaurante {
  private getPymeId(): string | null {
    return auth.currentUser?.uid ?? null;
  }

  async guardarMesas(layoutId: string, tables: any[]): Promise<void> {
    const pymeId = this.getPymeId();
    if (!pymeId) return;
    await layoutsCollection.set(pymeId, layoutId, { nombre: 'Sala principal', mesas: tables });
  }

  async cargarMesas(layoutId: string): Promise<any[]> {
    const pymeId = this.getPymeId();
    if (!pymeId) return [];
    const doc = await layoutsCollection.get(pymeId, layoutId);
    return (doc?.mesas as any[]) ?? [];
  }
}

export default new FirestoreRestaurante();

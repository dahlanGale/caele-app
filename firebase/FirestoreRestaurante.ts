import { auth, firestore } from '@/src/lib/firebase';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

class FirestoreRestaurante {
  // Obtiene el id de la pyme a partir del correo
  async getPymeIdByEmail(email: string): Promise<string | null> {
    try {
      const q = query(collection(firestore, 'pymes'), where('email', '==', email));
      const qs = await getDocs(q);
      if (!qs.empty) return qs.docs[0].id;
      return null;
    } catch (e) {
      throw e;
    }
  }

  // Helpers orientados a correo (reutilizables en otros contextos)
  async guardarMesasPorCorreo(email: string, layoutId: string, tables: any[]): Promise<void> {
    const pymeId = await this.getPymeIdByEmail(email);
    if (!pymeId) return;
    const ref = doc(firestore, 'pymes', pymeId, 'mesas', layoutId);
    await setDoc(ref, { tables }, { merge: true });
  }

  async cargarMesasPorCorreo(email: string, layoutId: string): Promise<any[]> {
    const pymeId = await this.getPymeIdByEmail(email);
    if (!pymeId) return [];
    const ref = doc(firestore, 'pymes', pymeId, 'mesas', layoutId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    const data = snap.data();
    return (data?.tables as any[]) ?? [];
  }

  // Conveniencia: usa usuario autenticado actual
  private getCurrentEmail(): string | null {
    return auth.currentUser?.email ?? null;
  }

  async guardarMesas(layoutId: string, tables: any[]): Promise<void> {
    const email = this.getCurrentEmail();
    if (!email) return;
    return this.guardarMesasPorCorreo(email, layoutId, tables);
  }

  async cargarMesas(layoutId: string): Promise<any[]> {
    const email = this.getCurrentEmail();
    if (!email) return [];
    return this.cargarMesasPorCorreo(email, layoutId);
  }
}

export default new FirestoreRestaurante();
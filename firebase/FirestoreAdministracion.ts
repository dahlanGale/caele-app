import { pymeCollection } from '@/src/services/firestore';

class FirestoreAdministracion {
  private sucursalSeleccionada: string | null;

  constructor() {
    const hasLocalStorage =
      typeof globalThis !== 'undefined' && typeof (globalThis as any).localStorage !== 'undefined';
    if (hasLocalStorage) {
      this.sucursalSeleccionada = (globalThis as any).localStorage.getItem('sucursalSeleccionada');
    } else {
      this.sucursalSeleccionada = null;
    }
  }

  async registrarPyme(data: { id?: string; password?: string; [key: string]: any }) {
    const { id, password: _password, ...values } = data;
    if (!id) throw new Error('El id de la pyme es requerido');
    await pymeCollection.set('', id, values);
    return id;
  }

  async listarPymes() {
    return pymeCollection.list('');
  }

  getSucursalSeleccionada() {
    return this.sucursalSeleccionada;
  }
}

export default new FirestoreAdministracion();

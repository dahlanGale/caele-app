import { usuariosCollection } from '@/src/services/firestore';

class FireStoreUsuarios {
  async registrarUsuario(data: { id?: string; password?: string; [key: string]: any }) {
    const { id, password: _password, ...values } = data;
    if (!id) throw new Error('El id del usuario es requerido');
    await usuariosCollection.set('', id, values);
    return id;
  }

  async listarUsuarios({ search }: { search: string }) {
    const all = await usuariosCollection.list('');
    if (!search) return all;
    const q = search.trim().toLowerCase();
    return all.filter((u) => (u.nombre ?? '').toLowerCase().includes(q));
  }

  async listarUsuarioPorId(id: string) {
    const doc = await usuariosCollection.get('', id);
    if (!doc) throw new Error(`No se encontró el usuario con id ${id}`);
    const { password: _password, ...dataSinPassword } = doc as any;
    return { id: doc.id, ...dataSinPassword };
  }
}

export default new FireStoreUsuarios();

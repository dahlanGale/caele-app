import { firestore } from '@/src/lib/firebase';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    where
} from 'firebase/firestore';
  
  class FireStoreUsuarios {
    
    // Método para registrar o actualizar un usuario
    async registrarUsuario(data: any) {
      try {
        const { id, ...values } = data;
        if (id) {
          // Si el id está presente, actualizamos el documento existente
          const userRef = doc(firestore, 'usuarios', id);
          await setDoc(userRef, values, { merge: true }); // Actualizamos usando merge: true
        } else {
          // Si no hay id, creamos un nuevo documento
          const docRef = await addDoc(collection(firestore, 'usuarios'), values);
          return docRef.id; // Retornamos el nuevo id
        }
      } catch (error) {
        throw error; // Manejo de errores
      }
    }
  
    // Método para listar usuarios con opción de búsqueda
    async listarUsuarios({ search }: { search: string }) {
      try {
        let q;
        if (search) {
          q = query(
            collection(firestore, 'usuarios'),
            where('nombre', '>=', search.trim()),
            where('nombre', '<', search.toLowerCase().trim() + '\uf8ff')
          );
        } else {
          q = query(collection(firestore, 'usuarios'));
        }
  
        const arrayObject: any[] = [];
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          arrayObject.push({
            id: doc.id,
            ...doc.data(),
          });
        });
  
        return arrayObject;
      } catch (error) {
        throw error; // Manejo de errores
      }
    }  
  
    // Método para listar usuarios por id
    async listarUsuarioPorId(id: string) {
      try {
        const docRef = doc(firestore, "usuarios", id);
        const docSnap = await getDoc(docRef);
  
        if (!docSnap.exists()) {
          throw new Error(`No se encontró el usuario con id ${id}`);
        }
  
        const { password, ...dataSinPassword } = docSnap.data() as {
          password?: unknown;
          [key: string]: unknown;
        };
  
        return {
          id: docSnap.id,
          ...dataSinPassword,
        };
      } catch (error) {
        console.error("Error en obtenerUsuarioPorId:", error);
        throw error;
      }
      }
  }
  
  export default new FireStoreUsuarios();
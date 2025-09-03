import { addDoc, collection, doc, getDocs, setDoc } from "firebase/firestore";
import { firestore } from "../app/config/firebase";

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

    // Método para registrar o actualizar una pyme
    async registrarPyme(data: any) {
      try {
        const { id, ...values } = data;
        if (id) {
          // Si el id está presente, actualizamos el documento existente
          const userRef = doc(firestore, 'pymes', id);
          await setDoc(userRef, values, { merge: true }); // Actualizamos usando merge: true
        } else {
          // Si no hay id, creamos un nuevo documento
          const docRef = await addDoc(collection(firestore, 'pymes'), values);
          return docRef.id; // Retornamos el nuevo id
        }
      } catch (error) {
        throw error; // Manejo de errores
      }
    }    

    // Método para listar pymes
    async listarPymes() {
      try {
        const q = collection(firestore, 'pymes');
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
    
}

export default new FirestoreAdministracion();
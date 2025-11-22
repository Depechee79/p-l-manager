import { db, auth } from './firebase-config.js';
import { 
    collection, 
    doc, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    getDocs,
    query
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export class FirestoreService {
    constructor() {
        this.db = db;
    }

    /**
     * Obtiene la referencia segura a la colección del usuario actual
     * Ruta: users/{uid}/{collectionName}
     */
    _getCollectionRef(collectionName) {
        const user = auth.currentUser;
        if (!user) throw new Error("⛔ Bloqueo de Seguridad: Usuario no autenticado.");
        
        const fullPath = `users/${user.uid}/${collectionName}`;
        // 🕵️ CHIVATO: Guardamos la ruta para el log
        this._lastPath = fullPath; 
        
        return collection(this.db, fullPath);
    }

    async add(collectionName, data) {
        try {
            const docId = data.id.toString(); 
            // Obtener referencia (esto actualiza _lastPath)
            const colRef = this._getCollectionRef(collectionName);
            const docRef = doc(colRef, docId);
            
            const { _synced, ...cloudData } = data;
            
            // Usar setDoc para forzar NUESTRO ID (Timestamp), no uno automático
            await setDoc(docRef, cloudData);
            
            console.log(`☁️ [FIRESTORE] Escribiendo en: ${this._lastPath}/${docId}`);
            return { success: true };
        } catch (error) {
            console.error(`❌ Error Firestore Add (${collectionName}):`, error);
            throw error;
        }
    }

    async update(collectionName, id, data) {
        try {
            const docRef = doc(this._getCollectionRef(collectionName), id.toString());
            // Solo subimos los datos, no el flag de sync
            const { _synced, ...cloudData } = data;
            
            await updateDoc(docRef, cloudData);
            console.log(`☁️ [FIRESTORE] Documento actualizado en ${collectionName}:`, id);
            return { success: true };
        } catch (error) {
            console.error(`❌ Error Firestore Update (${collectionName}):`, error);
            throw error;
        }
    }

    async delete(collectionName, id) {
        try {
            const colRef = this._getCollectionRef(collectionName); // Actualiza _lastPath
            const docRef = doc(colRef, id.toString());
            
            await deleteDoc(docRef);
            
            // LOG MEJORADO: Muestra la ruta completa
            console.log(`☁️ [FIRESTORE] ELIMINADO: ${this._lastPath}/${id}`);
            return { success: true };
        } catch (error) {
            console.error(`❌ Error Firestore Delete (${collectionName}):`, error);
            throw error;
        }
    }

    async getAll(collectionName) {
        try {
            const colRef = this._getCollectionRef(collectionName);
            const snapshot = await getDocs(colRef);
            return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
        } catch (error) {
            console.error(`❌ Error Firestore GetAll (${collectionName}):`, error);
            return [];
        }
    }
}
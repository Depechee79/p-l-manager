# PLAN DE EMERGENCIA - ROLLBACK

Este documento explica como revertir cambios si algo sale mal.

---

## CUANDO USAR ESTE PLAN

Usa este plan si despues de implementar los cambios:

- La app deja de funcionar completamente
- Nadie puede iniciar sesion
- Los datos no se guardan
- Errores masivos en la consola
- Los usuarios reportan problemas graves

---

## NIVEL 1: REVERTIR REGLAS DE SEGURIDAD

**Tiempo estimado:** 2 minutos

Si los usuarios no pueden leer/escribir datos despues de cambiar las reglas:

### Pasos:

1. Abre: https://console.firebase.google.com

2. Selecciona tu proyecto (pylhospitality)

3. Menu izquierdo: "Firestore Database"

4. Pestana superior: "Reglas"

5. Click en "Historial de versiones" (o "Version history")

6. Selecciona la version anterior (fecha antes del cambio)

7. Click en "Restaurar" o "Restore"

8. Click en "Publicar"

9. Espera 30 segundos

10. Refresca la app y verifica que funciona

### Reglas de emergencia (permiten todo temporalmente):

Si no puedes restaurar la version anterior, usa estas reglas temporales:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // REGLAS DE EMERGENCIA - SOLO USAR TEMPORALMENTE
    // Permite todo a usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**ADVERTENCIA:** Estas reglas son muy permisivas. Solo usarlas para desbloquear y luego corregir el problema real.

---

## NIVEL 2: REVERTIR CODIGO (FirestoreService.ts)

**Tiempo estimado:** 5 minutos

Si cambiaste el archivo FirestoreService.ts y la app falla:

### Opcion A: Usar el backup

1. Busca el archivo `FirestoreService.ts.backup` que creaste antes de modificar

2. Copia su contenido

3. Abre `src/core/services/FirestoreService.ts`

4. Reemplaza todo el contenido con el backup

5. Guarda el archivo

6. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Opcion B: Descargar version original

Si no tienes backup, busca la version original en tu repositorio Git:

```bash
# Ver historial del archivo
git log --oneline src/core/services/FirestoreService.ts

# Restaurar version anterior
git checkout HEAD~1 -- src/core/services/FirestoreService.ts

# O restaurar una version especifica
git checkout [commit-id] -- src/core/services/FirestoreService.ts
```

### Opcion C: Codigo minimo funcional

Si no puedes restaurar, usa esta version minima que funciona:

```typescript
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  Firestore,
} from 'firebase/firestore';
import type { CollectionName, FirebaseResponse } from '@/types';
import { getFirestoreInstance } from '@/config/firebase.config';

export class FirestoreService {
  private db: Firestore | null = null;

  constructor() {
    try {
      this.db = getFirestoreInstance();
    } catch (error) {
      console.warn('Firestore failed to initialize:', error);
    }
  }

  async add<T extends Record<string, any>>(
    collectionName: CollectionName,
    data: T,
    customId?: string
  ): Promise<FirebaseResponse<T & { id: string }>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized' };
    }
    try {
      if (customId) {
        const docRef = doc(this.db, collectionName, customId);
        await setDoc(docRef, data);
        return { success: true, data: { ...data, id: customId } as T & { id: string } };
      } else {
        const collectionRef = collection(this.db, collectionName);
        const docRef = await addDoc(collectionRef, data);
        return { success: true, data: { ...data, id: docRef.id } as T & { id: string } };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update<T>(collectionName: CollectionName, id: string, data: Partial<T>): Promise<FirebaseResponse<T>> {
    if (!this.db) return { success: false, error: 'Firestore not initialized' };
    try {
      const docRef = doc(this.db, collectionName, id);
      await updateDoc(docRef, data as any);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(collectionName: CollectionName, id: string): Promise<FirebaseResponse<void>> {
    if (!this.db) return { success: false, error: 'Firestore not initialized' };
    try {
      const docRef = doc(this.db, collectionName, id);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async get<T>(collectionName: CollectionName, id: string): Promise<FirebaseResponse<T>> {
    if (!this.db) return { success: false, error: 'Firestore not initialized' };
    try {
      const docRef = doc(this.db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } as T };
      }
      return { success: false, error: 'Document not found' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAll<T>(collectionName: CollectionName): Promise<FirebaseResponse<T[]>> {
    if (!this.db) return { success: false, error: 'Firestore not initialized' };
    try {
      const collectionRef = collection(this.db, collectionName);
      const snapshot = await getDocs(collectionRef);
      const data = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as T[];
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async testConnection(): Promise<FirebaseResponse<boolean>> {
    if (!this.db) return { success: false, error: 'Firestore not initialized', data: false };
    try {
      const testCollection = collection(this.db, 'test_connection');
      await getDocs(query(testCollection));
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed', data: false };
    }
  }
}
```

---

## NIVEL 3: REVERTIR INDICES

**Tiempo estimado:** 10-15 minutos

Los indices NO causan errores graves. El peor caso es que algunas queries sean lentas o fallen por falta de indice.

### Si quieres eliminar indices nuevos:

1. Firebase Console > Firestore > Indices

2. Busca los indices que agregaste (los mas recientes)

3. Click en los 3 puntos a la derecha de cada uno

4. Selecciona "Eliminar"

5. Confirma la eliminacion

**Nota:** Los indices existentes (cierres, facturas, nominas) NO deben eliminarse.

---

## NIVEL 4: RESTAURAR DATOS

**Tiempo estimado:** Variable (depende del tamano)

Si se borraron o corrompieron datos:

### Opcion A: Desde export de Firebase

1. Ve a Firebase Console > Firestore

2. Menu superior: Import/Export

3. Selecciona "Import"

4. Elige el archivo de backup que exportaste antes

5. Espera a que termine

### Opcion B: Contactar soporte Firebase

Si no tienes backup:

1. Ve a Firebase Console > Support

2. Abre un ticket

3. Explica que necesitas recuperar datos

4. Firebase tiene backups automaticos de los ultimos 7 dias

**Nota:** La recuperacion de Firebase tiene un coste adicional.

---

## NIVEL 5: NUCLEAR - VOLVER A VERSION ANTERIOR COMPLETA

**Tiempo estimado:** 30+ minutos

Si nada funciona y necesitas volver al estado anterior:

### Prerequisitos:
- Tener el codigo en Git
- Saber cual era el ultimo commit funcional

### Pasos:

```bash
# 1. Ver historial de commits
git log --oneline

# 2. Identificar el commit anterior a los cambios
# Busca uno con fecha anterior al inicio de los cambios

# 3. Crear una rama de backup del estado actual
git checkout -b backup-cambios-fallidos

# 4. Volver a main/master
git checkout main

# 5. Revertir al commit anterior
git reset --hard [commit-id-funcional]

# 6. Forzar push (CUIDADO - sobrescribe historial remoto)
git push --force origin main
```

**ADVERTENCIA:** `git reset --hard` y `git push --force` son destructivos. Solo usar si estas seguro.

---

## CONTACTOS DE EMERGENCIA

Si no puedes resolver el problema:

1. **Documentacion Firebase:** https://firebase.google.com/docs

2. **Stack Overflow:** Busca el error exacto que ves

3. **Firebase Support:** https://firebase.google.com/support

4. **GitHub Issues del proyecto:** Abre un issue con descripcion del problema

---

## PREVENCION FUTURA

Para evitar emergencias futuras:

1. **Siempre hacer backup** antes de cambios grandes

2. **Probar en entorno de desarrollo** antes de produccion

3. **Hacer cambios incrementales** (uno a la vez, no todo junto)

4. **Mantener documentacion** de que se cambio y cuando

5. **Tener plan de rollback** antes de empezar

---

## LOG DE INCIDENTES

Usa esta seccion para documentar incidentes:

### Incidente #1
- **Fecha:** _______________
- **Descripcion:** _______________
- **Causa:** _______________
- **Solucion aplicada:** _______________
- **Tiempo de resolucion:** _______________
- **Leccion aprendida:** _______________

### Incidente #2
- **Fecha:** _______________
- **Descripcion:** _______________
- **Causa:** _______________
- **Solucion aplicada:** _______________
- **Tiempo de resolucion:** _______________
- **Leccion aprendida:** _______________

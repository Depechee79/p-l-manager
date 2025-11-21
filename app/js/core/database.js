import { FirestoreService } from './firestore-service.js';

// ===============================================
// DATABASE (HYBRID ARCHITECTURE: LOCAL FIRST + CLOUD SYNC)
// ===============================================
export class Database { // <--- NOTA EL 'export' AQUÍ
    constructor() {
        // 1. Inicialización Síncrona (Legacy - Mantiene la UI viva)
        this.cierres = this.load('cierres') || [];
        this.facturas = this.load('facturas') || [];
        this.albaranes = this.load('albaranes') || [];
        this.proveedores = this.load('proveedores') || [];
        this.productos = this.load('productos') || [];
        this.escandallos = this.load('escandallos') || [];
        this.inventarios = this.load('inventarios') || [];
        this.delivery = this.load('delivery') || [];

        // 2. Servicio Cloud Real
        this.cloudService = new FirestoreService();
        this.cloudQueue = []; // Cola para offline
    }

    // --- MÉTODOS SÍNCRONOS (LEGACY) ---

    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Error cargando ${key}`, e);
            return [];
        }
    }

    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    /**
     * Método híbrido: Guarda Local (Sync) -> Sube a Cloud (Async)
     */
    add(collection, item) {
        // 1. Lógica Local (Inmediata)
        item.id = Date.now();
        item._synced = false;
        
        if (!this[collection]) this[collection] = [];
        this[collection].push(item);
        this.save(collection, this[collection]);

        // 2. Lógica Cloud (Real)
        this._syncToCloud(collection, 'ADD', item);

        return item;
    }

    update(collection, id, updatedItem) {
        // 1. Lógica Local
        const index = this[collection].findIndex(item => item.id === id);
        if (index !== -1) {
            const oldItem = this[collection][index];
            this[collection][index] = { 
                ...oldItem, 
                ...updatedItem, 
                id: id,
                _synced: false,
                updatedAt: new Date().toISOString()
            };
            this.save(collection, this[collection]);

            // 2. Lógica Cloud
            this._syncToCloud(collection, 'UPDATE', this[collection][index]);

            return this[collection][index];
        }
        return null;
    }

    delete(collection, id) {
        // 1. Lógica Local
        this[collection] = this[collection].filter(item => item.id !== id);
        this.save(collection, this[collection]);

        // 2. Lógica Cloud
        this._syncToCloud(collection, 'DELETE', { id });
    }

    getByPeriod(collection, period) {
        const now = new Date();
        const items = this[collection] || [];
        
        return items.filter(item => {
            if (!item.fecha) return true;
            const itemDate = new Date(item.fecha);
            if (isNaN(itemDate.getTime())) return false;

            switch(period) {
                case 'dia': return itemDate.toDateString() === now.toDateString();
                case 'semana': 
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return itemDate >= weekAgo;
                case 'mes': 
                    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                case 'anio': 
                    return itemDate.getFullYear() === now.getFullYear();
                default: return true;
            }
        });
    }

    // --- SINCRONIZACIÓN REAL ---

    async _syncToCloud(collectionName, action, data) {
        try {
            if (action === 'ADD') {
                await this.cloudService.add(collectionName, data);
            } else if (action === 'UPDATE') {
                await this.cloudService.update(collectionName, data.id, data);
            } else if (action === 'DELETE') {
                await this.cloudService.delete(collectionName, data.id);
            }

            // Si es ADD o UPDATE y tuvo éxito, marcamos como sincronizado en local
            if (action !== 'DELETE') {
                const index = this[collectionName].findIndex(i => i.id === data.id);
                if (index !== -1) {
                    this[collectionName][index]._synced = true;
                    this.save(collectionName, this[collectionName]);
                    console.log(`✨ Sincronizado OK: ${collectionName}/${data.id}`);
                }
            }

        } catch (error) {
            console.warn(`⚠️ Fallo al subir a Nube (${action} ${collectionName}):`, error.message);
        }
    }
}

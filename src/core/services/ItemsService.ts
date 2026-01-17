import { DatabaseService } from './DatabaseService';
import type { BaseEntity } from '@types';

export interface Familia extends BaseEntity {
    nombre: string;
    descripcion?: string;
}

export interface Subfamilia extends BaseEntity {
    nombre: string;
    familiaId: string | number;
    descripcion?: string;
}

export interface Terminal extends BaseEntity {
    nombre: string;
    descripcion?: string;
}

export interface MedioPago extends BaseEntity {
    nombre: string;
    descripcion?: string;
}

export interface PlataformaDelivery extends BaseEntity {
    nombre: string;
    descripcion?: string;
}

export interface Persona extends BaseEntity {
    nombre: string;
    rol?: string;
    activo: boolean;
}


export class ItemsService {
    constructor(private db: DatabaseService) { }

    // Familias
    getFamilias(): Familia[] {
        // Extract from existing products
        const products = this.db.productos;
        const familiasFromProducts = Array.from(
            new Set(products.map(p => p.familia).filter(Boolean))
        );

        // Get from stored familias if exists
        const storedFamilias = (this.db as any).familias || [];

        // Combine and deduplicate
        const allFamilias = new Map<string | number, Familia>();

        storedFamilias.forEach((f: Familia) => {
            allFamilias.set(f.id, f);
        });

        familiasFromProducts.forEach((nombre, idx) => {
            if (!Array.from(allFamilias.values()).find(f => f.nombre === nombre)) {
                allFamilias.set(`temp_${idx}`, {
                    id: `temp_${idx}`,
                    nombre: nombre as string,
                });
            }
        });

        return Array.from(allFamilias.values());
    }

    addFamilia(nombre: string, descripcion?: string): Familia {
        const nueva: Familia = {
            id: Date.now(),
            nombre: nombre.trim(),
            descripcion,
            createdAt: new Date().toISOString(),
        };

        if (!(this.db as any).familias) {
            (this.db as any).familias = [];
        }
        (this.db as any).familias.push(nueva);
        return nueva;
    }

    // Subfamilias
    getSubfamilias(familiaId?: string | number): Subfamilia[] {
        const products = this.db.productos;
        let subfamiliasFromProducts: string[] = [];

        if (familiaId) {
            const familia = this.getFamilias().find(f => f.id === familiaId);
            if (familia) {
                subfamiliasFromProducts = Array.from(
                    new Set(
                        products
                            .filter(p => p.familia === familia.nombre)
                            .map(p => p.subfamilia)
                            .filter(Boolean) as string[]
                    )
                );
            }
        } else {
            subfamiliasFromProducts = Array.from(
                new Set(products.map(p => p.subfamilia).filter(Boolean) as string[])
            );
        }

        const storedSubfamilias = ((this.db as any).subfamilias || []) as Subfamilia[];
        const filtered = familiaId
            ? storedSubfamilias.filter(sf => sf.familiaId === familiaId)
            : storedSubfamilias;

        const all = new Map<string | number, Subfamilia>();
        filtered.forEach(sf => all.set(sf.id, sf));

        subfamiliasFromProducts.forEach((nombre, idx) => {
            if (!Array.from(all.values()).find(sf => sf.nombre === nombre)) {
                all.set(`temp_${idx}`, {
                    id: `temp_${idx}`,
                    nombre: nombre as string,
                    familiaId: familiaId || '',
                });
            }
        });

        return Array.from(all.values());
    }

    addSubfamilia(nombre: string, familiaId: string | number, descripcion?: string): Subfamilia {
        const nueva: Subfamilia = {
            id: Date.now(),
            nombre: nombre.trim(),
            familiaId,
            descripcion,
            createdAt: new Date().toISOString(),
        };

        if (!(this.db as any).subfamilias) {
            (this.db as any).subfamilias = [];
        }
        (this.db as any).subfamilias.push(nueva);
        return nueva;
    }

    // Terminales
    getTerminales(): Terminal[] {
        const cierres = this.db.cierres;
        const terminalesFromCierres = Array.from(
            new Set(
                cierres
                    .flatMap(c => (c.datafonos || []).map((d: any) => d.terminal))
                    .filter(Boolean)
            )
        );

        const stored = ((this.db as any).terminales || []) as Terminal[];
        const all = new Map<string | number, Terminal>();
        stored.forEach(t => all.set(t.id, t));

        terminalesFromCierres.forEach((nombre, idx) => {
            if (!Array.from(all.values()).find(t => t.nombre === nombre)) {
                all.set(`temp_${idx}`, {
                    id: `temp_${idx}`,
                    nombre: nombre as string,
                });
            }
        });

        return Array.from(all.values());
    }

    addTerminal(nombre: string, descripcion?: string): Terminal {
        const nuevo: Terminal = {
            id: Date.now(),
            nombre: nombre.trim(),
            descripcion,
            createdAt: new Date().toISOString(),
        };

        if (!(this.db as any).terminales) {
            (this.db as any).terminales = [];
        }
        (this.db as any).terminales.push(nuevo);
        return nuevo;
    }

    // Medios de Pago
    getMediosPago(): MedioPago[] {
        const defaults = ['Transferencia', 'Bizum', 'Ticket Restaurant', 'Sodexo'];
        const stored = ((this.db as any).mediosPago || []) as MedioPago[];
        const all = new Map<string | number, MedioPago>();

        stored.forEach(m => all.set(m.id, m));
        defaults.forEach((nombre, idx) => {
            if (!Array.from(all.values()).find(m => m.nombre === nombre)) {
                all.set(`default_${idx}`, {
                    id: `default_${idx}`,
                    nombre,
                });
            }
        });

        return Array.from(all.values());
    }

    addMedioPago(nombre: string, descripcion?: string): MedioPago {
        const nuevo: MedioPago = {
            id: Date.now(),
            nombre: nombre.trim(),
            descripcion,
            createdAt: new Date().toISOString(),
        };

        if (!(this.db as any).mediosPago) {
            (this.db as any).mediosPago = [];
        }
        (this.db as any).mediosPago.push(nuevo);
        return nuevo;
    }

    // Plataformas Delivery
    getPlataformasDelivery(): PlataformaDelivery[] {
        const defaults = ['Uber Eats', 'Glovo', 'Just Eat', 'Bolt'];
        const stored = ((this.db as any).plataformasDelivery || []) as PlataformaDelivery[];
        const all = new Map<string | number, PlataformaDelivery>();

        stored.forEach(p => all.set(p.id, p));
        defaults.forEach((nombre, idx) => {
            if (!Array.from(all.values()).find(p => p.nombre === nombre)) {
                all.set(`default_${idx}`, {
                    id: `default_${idx}`,
                    nombre,
                });
            }
        });

        return Array.from(all.values());
    }

    addPlataformaDelivery(nombre: string, descripcion?: string): PlataformaDelivery {
        const nueva: PlataformaDelivery = {
            id: Date.now(),
            nombre: nombre.trim(),
            descripcion,
            createdAt: new Date().toISOString(),
        };

        if (!(this.db as any).plataformasDelivery) {
            (this.db as any).plataformasDelivery = [];
        }
        (this.db as any).plataformasDelivery.push(nueva);
        return nueva;
    }

    // Personas
    getPersonas(): Persona[] {
        const inventarios = this.db.inventarios;
        const personasFromInventarios = Array.from(
            new Set(inventarios.map(inv => inv.persona).filter(Boolean))
        );

        const stored = ((this.db as any).personas || []) as Persona[];
        const all = new Map<string | number, Persona>();
        stored.forEach(p => all.set(p.id, p));

        personasFromInventarios.forEach((nombre, idx) => {
            if (!Array.from(all.values()).find(p => p.nombre === nombre)) {
                all.set(`temp_${idx}`, {
                    id: `temp_${idx}`,
                    nombre: nombre as string,
                    activo: true,
                });
            }
        });

        return Array.from(all.values());
    }

    addPersona(nombre: string, rol?: string): Persona {
        const nueva: Persona = {
            id: Date.now(),
            nombre: nombre.trim(),
            rol,
            activo: true,
            createdAt: new Date().toISOString(),
        };

        if (!(this.db as any).personas) {
            (this.db as any).personas = [];
        }
        (this.db as any).personas.push(nueva);
        return nueva;
    }
}

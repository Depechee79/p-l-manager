import { BaseEntity } from './index';

/**
 * Tipos de IVA soportados en escandallos
 */
export type TipoIVA = 0 | 4 | 10 | 21;

/**
 * Ingrediente dentro de un escandallo
 */
export interface EscandaloIngrediente {
    productoId: number | string;
    nombre: string;
    cantidad: number;
    unidad: string;
    costeUnitario: number;
    costeTotal: number;
}

/**
 * Entidad principal de Escandallo
 */
export interface Escandallo extends BaseEntity {
    nombre: string;
    pvpConIVA: number;
    tipoIVA: TipoIVA;
    pvpNeto: number;
    ingredientes: EscandaloIngrediente[];
    costeTotalNeto: number;
    foodCostPct: number;
    margenBrutoPct: number;
    familia?: string;
    subfamilia?: string;
    alergenos?: string[];
    descripcion?: string;
    notas?: string;
    imagen?: string | null;
    esMaestro?: boolean;
    companyId?: string;
    restaurantId?: string;
    masterId?: string;
}

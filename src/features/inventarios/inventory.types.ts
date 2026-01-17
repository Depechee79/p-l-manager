export type CountingZone = 'bar' | 'cocina' | 'camara' | 'almacen';
export type CountingMethod = 'total' | 'pack';

export interface ProductCount {
    productoId: string | number;
    nombre: string;
    zona: CountingZone;
    cantidadTotal?: number;
    cantidadPack?: number;
    unidadesPorPack?: number;
    metodo: CountingMethod;
}

export interface InventoryFormData {
    fecha: string;
    persona: string;
    nombre: string;
    zona: CountingZone;
    productos: ProductCount[];
    notas?: string;
}

export const INITIAL_FORM_DATA: InventoryFormData = {
    fecha: new Date().toISOString().split('T')[0],
    persona: '',
    nombre: '',
    zona: 'bar',
    productos: [],
    notas: '',
};

export const ZONES: { value: CountingZone; label: string }[] = [
    { value: 'bar', label: 'Barra' },
    { value: 'cocina', label: 'Cocina' },
    { value: 'camara', label: 'Cámara' },
    { value: 'almacen', label: 'Almacén' },
];

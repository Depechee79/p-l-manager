import type { BaseEntity } from '@types';

export interface OrderProduct {
    productoId: string | number;
    nombre: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    subtotal: number;
}

export type OrderStatus = 'borrador' | 'enviado' | 'recibido' | 'cancelado';

export interface Order extends BaseEntity {
    restaurantId?: string | number;
    fecha: string;
    fechaEntrega?: string;
    proveedorId: string | number;
    proveedorNombre: string;
    productos: OrderProduct[];
    total: number;
    estado: OrderStatus;
    notas?: string;
}

export interface OrderFormData {
    fecha: string;
    fechaEntrega?: string;
    proveedorId: string;
    productos: Array<{
        productoId: string;
        cantidad: number;
        unidad: string;
        precioUnitario: number;
    }>;
    estado: OrderStatus;
    notas?: string;
}

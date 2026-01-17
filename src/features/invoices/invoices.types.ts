import type { Invoice, InvoiceProduct } from '@types';

export interface InvoiceFormData {
    tipo: 'factura' | 'albaran';
    numeroFactura: string;
    proveedorId: number | string | null;
    fecha: string;
    total: number;
    productos: InvoiceProduct[];
    metodoPago?: string;
    notas?: string;
}

export type { Invoice, InvoiceProduct };

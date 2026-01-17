import type { Datafono, OtroMedio, CashBreakdown } from '@types';

export interface ClosingFormData {
    fecha: string;
    turno: 'dia_completo' | 'mediodia' | 'noche';
    efectivoContado: number;
    desgloseEfectivo: Partial<CashBreakdown>;
    datafonos: Datafono[];
    totalDatafonos: number;
    otrosMedios: OtroMedio[];
    totalOtrosMedios: number;
    deliveryBreakdown: { plataforma: string; importe: number }[];
    totalDelivery: number;
    posEfectivo: number;
    posTarjetas: number;
    posDelivery: number;
    posTickets: number;
    posExtras: number;
    totalReal: number;
    totalPos: number;
    descuadreTotal: number;
    propina: number;
    notasDescuadre?: string;
}

export const INITIAL_FORM_STATE: ClosingFormData = {
    fecha: new Date().toISOString().split('T')[0],
    turno: 'dia_completo',
    efectivoContado: 0,
    desgloseEfectivo: {},
    datafonos: [],
    totalDatafonos: 0,
    otrosMedios: [],
    totalOtrosMedios: 0,
    deliveryBreakdown: [],
    totalDelivery: 0,
    posEfectivo: 0,
    posTarjetas: 0,
    posDelivery: 0,
    posTickets: 0,
    posExtras: 0,
    totalReal: 0,
    totalPos: 0,
    descuadreTotal: 0,
    propina: 0,
    notasDescuadre: '',
};

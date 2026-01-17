// ============================================
// WORKFORCE MANAGEMENT TYPES
// ============================================

import type { BaseEntity } from './index';

/**
 * Tipo de incidencia de asistencia
 */
export type IncidenceType = 'retraso' | 'ausencia_injustificada' | 'baja_medica' | 'permiso' | 'vacaciones';

/**
 * Estado de una solicitud o registro
 */
export type ValidationStatus = 'pendiente' | 'aprobado' | 'rechazado';

/**
 * Registro de Fichaje (Time Entry)
 * Control de presencia diario
 */
export interface TimeEntry extends BaseEntity {
    workerId: string;
    restaurantId: string;
    date: string; // YYYY-MM-DD

    // Entradas y Salidas
    entryTime: string; // ISO String time part relevant
    exitTime?: string; // ISO String

    // Pausas
    breaks: {
        startTime: string;
        endTime?: string;
        type: 'comida' | 'descanso' | 'otro';
    }[];

    // Cálculos
    totalWorkedMinutes?: number;
    expectedWorkedMinutes?: number; // Basado en el turno planificado

    // Meta datsa
    location?: {
        lat: number;
        lng: number;
        accuracy?: number;
    };
    device?: string;
    isManualParams?: boolean; // Si ha sido modificado manualmente por un supervisor

    // Validación
    status: 'activo' | 'cerrado' | 'validado';
    supervisorNotes?: string;
}

/**
 * Turno Planificado (Shift)
 * Para el cuadrante de horarios
 */
export interface Shift extends BaseEntity {
    workerId: string;
    restaurantId: string;
    date: string; // YYYY-MM-DD

    startTime: string; // HH:mm
    endTime: string; // HH:mm

    role: string; // Rol que desempeñará en ese turno (puede ser distinto al principal)
    area?: 'barra' | 'sala' | 'cocina' | 'terraza';

    isPublished: boolean;
    notes?: string;
}

/**
 * Ausencia o Incidencia (Absence)
 */
export interface Absence extends BaseEntity {
    workerId: string;
    type: IncidenceType;

    startDate: string;
    endDate: string;

    reason?: string;
    status: ValidationStatus;

    approvedBy?: string; // User ID
    rejectionReason?: string;

    documentUrl?: string; // Para bajas médicas o justificantes
}

/**
 * Solicitud de Vacaciones
 */
export interface VacationRequest extends BaseEntity {
    workerId: string;
    startDate: string;
    endDate: string;

    daysCount: number;
    status: ValidationStatus;

    requestDate: string;
    responseDate?: string;
    approvedBy?: string;
}

// ============================================
// PAYROLL TYPES (Nóminas)
// ============================================

/**
 * Estado de una nómina
 */
export type NominaStatus = 'borrador' | 'pendiente' | 'pagada' | 'anulada';

/**
 * Nómina mensual de un trabajador
 * Se usa para calcular el Labor Cost en P&L
 */
export interface Nomina extends BaseEntity {
    /** Restaurante al que pertenece */
    restaurantId: string | number;

    /** Trabajador al que corresponde la nómina */
    workerId: string | number;
    workerNombre: string;

    /** Período de la nómina */
    mes: number; // 1-12
    anio: number; // YYYY
    periodo: string; // "YYYY-MM" for easy grouping

    /** Importes */
    salarioBruto: number;
    seguridadSocialEmpresa: number; // ~30% del bruto típicamente
    seguridadSocialTrabajador: number;
    irpf: number;
    salarioNeto: number;

    /** Desglose */
    horasNormales: number;
    horasExtras: number;
    importeHorasExtras: number;
    complementos: number; // Propinas, bonus, etc.
    deducciones: number; // Anticipos, etc.

    /** Estado y control */
    status: NominaStatus;
    fechaPago?: string;
    metodoPago?: 'transferencia' | 'efectivo' | 'cheque';

    /** Notas */
    notas?: string;
}

/**
 * Resumen de nóminas por período para P&L
 */
export interface NominaSummary {
    totalSalarioBruto: number;
    totalSeguridadSocialEmpresa: number;
    totalCostePersonal: number; // Bruto + SS Empresa
    countNominas: number;
}

/**
 * Calcula el resumen de nóminas para un período
 */
export function calculateNominaSummary(nominas: Nomina[]): NominaSummary {
    const pagadas = nominas.filter(n => n.status === 'pagada' || n.status === 'pendiente');

    return {
        totalSalarioBruto: pagadas.reduce((sum, n) => sum + (n.salarioBruto || 0), 0),
        totalSeguridadSocialEmpresa: pagadas.reduce((sum, n) => sum + (n.seguridadSocialEmpresa || 0), 0),
        totalCostePersonal: pagadas.reduce((sum, n) => sum + (n.salarioBruto || 0) + (n.seguridadSocialEmpresa || 0), 0),
        countNominas: pagadas.length,
    };
}

/**
 * Labels para estados de nómina
 */
export const NOMINA_STATUS_LABELS: Record<NominaStatus, string> = {
    borrador: 'Borrador',
    pendiente: 'Pendiente',
    pagada: 'Pagada',
    anulada: 'Anulada',
};

/**
 * Colores para estados de nómina
 */
export const NOMINA_STATUS_COLORS: Record<NominaStatus, string> = {
    borrador: 'var(--text-muted)',
    pendiente: 'var(--warning)',
    pagada: 'var(--success)',
    anulada: 'var(--danger)',
};


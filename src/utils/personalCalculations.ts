import type { Nomina, NominaStatus, NominaSummary } from '../types/personal.types';

/**
 * Labels for payroll statuses
 */
export const NOMINA_STATUS_LABELS: Record<NominaStatus, string> = {
    borrador: 'Borrador',
    pendiente: 'Pendiente',
    pagada: 'Pagada',
    anulada: 'Anulada',
};

/**
 * Colors for payroll statuses (CSS variable references)
 */
export const NOMINA_STATUS_COLORS: Record<NominaStatus, string> = {
    borrador: 'var(--text-muted)',
    pendiente: 'var(--warning)',
    pagada: 'var(--success)',
    anulada: 'var(--danger)',
};

/**
 * Calculate payroll summary for a period.
 * Includes paid and pending payrolls.
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

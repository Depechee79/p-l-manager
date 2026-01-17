import React from 'react';
import { Card, Button, Table, Badge } from '@components';
import { Check, X, AlertOctagon } from 'lucide-react';
import type { TimeEntry, Shift } from '@types';

interface IncidenceLogProps {
    entries: TimeEntry[];
    shifts: Shift[];
    onResolveIncidence: (id: string, action: 'justify' | 'penalize', note?: string) => void;
}

interface DetectedIncidence {
    id: string;
    workerId: string;
    workerName: string;
    type: 'retraso' | 'falta_fichaje' | 'salida_temprana';
    date: string;
    details: string;
    severity: 'low' | 'medium' | 'high';
}

export const IncidenceLog: React.FC<IncidenceLogProps> = ({ entries, shifts, onResolveIncidence }) => {
    // Logic to detect incidences based on entries and shifts
    const detectIncidences = (): DetectedIncidence[] => {
        const result: DetectedIncidence[] = [];
        const GRACE_PERIOD_MINUTES = 15;

        entries.forEach(entry => {
            // Only check if we have an entry time
            if (!entry.entryTime) return;

            // Find corresponding shift (simplify: same day, same worker)
            const entryTime = new Date(entry.entryTime);
            // Assuming we want to compare against the date of the entry
            const entryDateString = entryTime.toDateString();

            const shift = shifts.find(s =>
                s.workerId === entry.workerId &&
                new Date(s.date).toDateString() === entryDateString // Use s.date instead of scanning all shifts
            );

            if (shift) {
                // Parse Shift Start Time (HH:mm)
                const [h, m] = shift.startTime.split(':').map(Number);
                const shiftDate = new Date(entryTime);
                shiftDate.setHours(h, m, 0, 0);

                // Calculate difference
                const diffMs = entryTime.getTime() - shiftDate.getTime();
                const diffMin = Math.floor(diffMs / 60000);

                if (diffMin > GRACE_PERIOD_MINUTES) {
                    result.push({
                        id: `inc-late-${entry.id}`,
                        workerId: entry.workerId,
                        workerName: 'Empleado ' + entry.workerId, // Ideally fetch name
                        type: 'retraso',
                        date: entry.entryTime,
                        details: `Entrada tardía (+${diffMin} min)`,
                        severity: diffMin > 60 ? 'high' : diffMin > 30 ? 'medium' : 'low'
                    });
                }
            }
        });

        return result;
    };

    const incidences = detectIncidences();

    return (
        <Card>
            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <div style={{
                        padding: 'var(--spacing-sm)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--danger-light)',
                        color: 'var(--danger)'
                    }}>
                        <AlertOctagon size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-main)' }}>Panel de Incidencias</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>
                            {incidences.length} incidencias pendientes de revisión
                        </p>
                    </div>
                </div>
            </div>

            <Table
                columns={[
                    { header: 'Empleado', key: 'workerName' },
                    { header: 'Fecha', key: 'date', render: (val) => new Date(val).toLocaleDateString('es-ES') },
                    {
                        header: 'Tipo', key: 'type', render: (val) => (
                            <Badge variant="outline" style={{ textTransform: 'capitalize' }}>
                                {val.replace('_', ' ')}
                            </Badge>
                        )
                    },
                    { header: 'Detalles', key: 'details' },
                    {
                        header: 'Acciones', key: 'actions', render: (_, row) => (
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <Button size="sm" variant="success" onClick={() => onResolveIncidence(row.id, 'justify')}>
                                    <Check size={14} style={{ marginRight: 'var(--spacing-xs)' }} /> Justificar
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => onResolveIncidence(row.id, 'penalize')}>
                                    <X size={14} style={{ marginRight: 'var(--spacing-xs)' }} /> Sancionar
                                </Button>
                            </div>
                        )
                    }
                ]}
                data={incidences}
            />
        </Card>
    );
};

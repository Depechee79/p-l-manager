import React, { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
} from 'lucide-react';
import { Button, Card, Select, Modal, Input } from '@shared/components';
import { useWorkers } from '../hooks/useWorkers';
import { useDatabase, useRestaurantContext } from '@core';
import type { Shift, Worker } from '@types';
import { useToast } from '@utils/toast';

/**
 * HorariosPage - Gestión de Turnos y Cuadrantes
 */
export const HorariosPage: React.FC = () => {
    // Correct usage based on hook pattern
    const { currentRestaurant } = useRestaurantContext();

    const { db } = useDatabase();
    const { showToast } = useToast();
    const companyId = currentRestaurant?.companyId || '';

    const { workers } = useWorkers(companyId);

    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>([]);

    // Modal
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

    // Mock Load Shifts (Replace with DB hook)
    useEffect(() => {
        // In a real implementation:
        // const loaded = db.shifts || [];
        // setShifts(loaded);
    }, [db, currentDate]);

    // Calendar Helpers
    const startOfWeek = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        return new Date(d.setDate(diff));
    }, [currentDate]);

    const weekDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d);
        }
        return days;
    }, [startOfWeek]);

    const handlePrevWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };

    const handleNextWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {/* Toolbar */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', background: 'var(--surface-muted)', borderRadius: 'var(--radius)', padding: 'var(--spacing-xs)' }}>
                            <Button variant="ghost" size="sm" onClick={handlePrevWeek}><ChevronLeft size={16} /></Button>
                            <span style={{ fontWeight: 600, padding: '0 var(--spacing-sm)', minWidth: '150px', textAlign: 'center' }}>
                                {startOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} -
                                {weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                            </span>
                            <Button variant="ghost" size="sm" onClick={handleNextWeek}><ChevronRight size={16} /></Button>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <Button variant="primary" onClick={() => setIsShiftModalOpen(true)}>
                            <Plus size={16} /> Nuevo Turno
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Calendar Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '200px repeat(7, 1fr)',
                gap: '1px',
                backgroundColor: 'var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden'
            }}>
                {/* Header Row */}
                <div style={{ backgroundColor: 'var(--surface)', padding: 'var(--spacing-md)', fontWeight: 600 }}>
                    Personal
                </div>
                {weekDays.map(day => (
                    <div key={day.toISOString()} style={{
                        backgroundColor: 'var(--surface)',
                        padding: 'var(--spacing-sm)',
                        textAlign: 'center',
                        borderBottom: day.toDateString() === new Date().toDateString() ? '3px solid var(--primary)' : 'none'
                    }}>
                        <div style={{ textTransform: 'capitalize', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                            {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>
                            {day.getDate()}
                        </div>
                    </div>
                ))}

                {/* Rows per Worker */}
                {workers.map(worker => (
                    <React.Fragment key={worker.id}>
                        {/* Worker Column */}
                        <div style={{ backgroundColor: 'var(--surface)', padding: 'var(--spacing-sm)', borderRight: '1px solid var(--border-light)' }}>
                            <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{worker.nombre} {worker.apellidos.charAt(0)}.</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{worker.puesto}</div>
                            <div style={{ marginTop: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--text-light)' }}>0h / 40h</div>
                        </div>

                        {/* Days Columns */}
                        {weekDays.map(day => (
                            <div key={`${worker.id}-${day.toISOString()}`} style={{
                                backgroundColor: 'var(--surface)',
                                minHeight: '80px',
                                padding: '4px',
                                cursor: 'pointer',
                                transition: 'background-color 0.1s'
                            }}
                                className="calendar-cell"
                            >
                                {/* Shift Item Render */}
                                {(() => {
                                    // Find shift for this worker and day
                                    // Match by YYYY-MM-DD
                                    // Note: day is a Date object (00:00:00 local time usually depending on creation)
                                    // We need to compare specific date strings
                                    const dayString = day.toISOString().split('T')[0];

                                    const shift = shifts.find(s =>
                                        String(s.workerId) === String(worker.id) &&
                                        s.date === dayString
                                    );

                                    if (shift) {
                                        return (
                                            <div style={{
                                                backgroundColor: 'var(--primary-light)',
                                                borderLeft: '3px solid var(--primary)',
                                                borderRadius: '4px',
                                                padding: 'var(--spacing-xs)',
                                                fontSize: 'var(--font-size-xs)',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{ fontWeight: '600', color: 'var(--primary-dark)' }}>{shift.startTime} - {shift.endTime}</div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>{shift.role}</div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div style={{
                                            border: '1px dashed var(--border)',
                                            height: '100%',
                                            borderRadius: 'var(--radius-sm)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: 0,
                                        }}
                                            className="add-shift-hover"
                                        >
                                            <Plus size={14} color="var(--text-light)" />
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>

            <Modal
                open={isShiftModalOpen}
                onClose={() => setIsShiftModalOpen(false)}
                title="Añadir Turno"
            >
                <ShiftForm
                    workers={workers}
                    currentRestaurantId={currentRestaurant?.id}
                    onSave={(newShift) => {
                        // Create full shift object
                        const shift: Shift = {
                            ...newShift,
                            id: Date.now(),
                            restaurantId: String(newShift.restaurantId),
                        };

                        const updatedShifts = [...shifts, shift];
                        setShifts(updatedShifts);
                        showToast({ title: 'Turno creado', message: 'El turno se ha asignado correctamente', type: 'success' });
                        setIsShiftModalOpen(false);
                    }}
                    onCancel={() => setIsShiftModalOpen(false)}
                    initialDate={currentDate}
                />
            </Modal>
        </div>
    );
};

// Sub-component for the form to keep main component clean
const ShiftForm: React.FC<{
    workers: Worker[];
    currentRestaurantId?: number | string;
    onSave: (shift: Omit<Shift, 'id'>) => void;
    onCancel: () => void;
    initialDate: Date;
}> = ({ workers, currentRestaurantId, onSave, onCancel, initialDate }) => {
    const [formData, setFormData] = useState({
        workerId: '',
        date: initialDate.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        role: ''
    });

    const handleSubmit = () => {
        if (!formData.workerId || !formData.date || !formData.startTime || !formData.endTime) return;

        onSave({
            workerId: formData.workerId,
            restaurantId: String(currentRestaurantId || ''),
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            role: formData.role,
            isPublished: true
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <Select
                label="Trabajador"
                value={formData.workerId}
                onChange={(val) => {
                    const w = workers.find(w => String(w.id) === val);
                    setFormData({ ...formData, workerId: val, role: w?.puesto || '' });
                }}
                options={workers.map(w => ({ value: String(w.id), label: `${w.nombre} ${w.apellidos}` }))}
                placeholder="Seleccionar trabajador..."
                fullWidth
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <Input
                    type="date"
                    label="Fecha"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    fullWidth
                />
                <Input
                    label="Puesto / Rol"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Ej: Cocinero"
                    fullWidth
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <Input
                    type="time"
                    label="Hora Inicio"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    fullWidth
                />
                <Input
                    type="time"
                    label="Hora Fin"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    fullWidth
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button variant="primary" onClick={handleSubmit}>Guardar Turno</Button>
            </div>
        </div>
    );
};

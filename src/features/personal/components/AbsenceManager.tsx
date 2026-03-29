import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Card, Button, Input, Select, Modal, Badge } from '@components';
import { Calendar, Plus, Clock } from 'lucide-react';
import type { Absence, VacationRequest } from '@types';

type CombinedListItem = (VacationRequest | Absence) & { category: string; color: string };

interface AbsenceManagerProps {
    requests: VacationRequest[];
    absences: Absence[];
    onApprove: (id: string, type: 'vacation' | 'absence') => void;
    onReject: (id: string, type: 'vacation' | 'absence', reason: string) => void;
    onCreateRequest: (data: { type: string; startDate: string; endDate: string; notes: string }) => void;
}

export const AbsenceManager: React.FC<AbsenceManagerProps> = ({ requests, absences, onApprove, onReject, onCreateRequest }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRequest, setNewRequest] = useState({
        type: 'vacaciones',
        startDate: '',
        endDate: '',
        notes: ''
    });

    const handleSubmit = () => {
        onCreateRequest(newRequest);
        setIsModalOpen(false);
        setNewRequest({ type: 'vacaciones', startDate: '', endDate: '', notes: '' });
    };

    // Calculate balances
    const TOTAL_VACATION_DAYS = 30;
    const usedDays = requests
        .filter(r => r.status === 'aprobado')
        .reduce((sum, r) => sum + (r.daysCount || 0), 0);
    const availableDays = TOTAL_VACATION_DAYS - usedDays;
    const pendingCount = requests.filter(r => r.status === 'pendiente').length;

    const combinedList = [
        ...requests.map(r => ({ ...r, category: 'Solicitud Vacaciones', color: 'primary' })),
        ...absences.map(a => ({ ...a, category: 'Baja / Ausencia', color: 'warning' }))
    ].sort((a, b) => {
        const rawA = 'requestDate' in a ? a.requestDate : a.startDate;
        const rawB = 'requestDate' in b ? b.requestDate : b.startDate;
        const dateA = rawA instanceof Timestamp ? rawA.toDate() : new Date(rawA);
        const dateB = rawB instanceof Timestamp ? rawB.toDate() : new Date(rawB);
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Header / Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                <Card style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-muted) 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{ padding: 'var(--spacing-sm)', background: 'var(--primary-light)', borderRadius: '8px', color: 'var(--primary)' }}>
                            <Calendar size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>{availableDays}</div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Días Disponibles</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{ padding: 'var(--spacing-sm)', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px', color: 'var(--warning-dark)' }}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>{pendingCount}</div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Pendientes Aprobación</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main List */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Historial y Solicitudes</h3>
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} style={{ marginRight: '4px' }} /> Nueva Solicitud
                    </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {combinedList.map((item: CombinedListItem) => (
                        <div key={item.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 'var(--spacing-md)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            background: 'var(--surface)'
                        }}>
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, color: 'var(--text-secondary)'
                                }}>
                                    WK
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                        {item.category === 'Solicitud Vacaciones' ? 'Vacaciones' : ('type' in item ? item.type : '')}
                                        <Badge variant={item.status === 'pendiente' ? 'warning' : (item.status === 'aprobado' ? 'success' : 'danger')}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                                        {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {item.status === 'pendiente' && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button variant="secondary" size="sm" onClick={() => onReject(String(item.id), item.category.includes('Vacaciones') ? 'vacation' : 'absence', 'Rechazado por director')}>
                                        Rechazar
                                    </Button>
                                    <Button variant="primary" size="sm" onClick={() => onApprove(String(item.id), item.category.includes('Vacaciones') ? 'vacation' : 'absence')}>
                                        Aprobar
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Solicitud">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: 'var(--spacing-md)' }}>
                    <Select
                        label="Tipo de Ausencia"
                        value={newRequest.type}
                        onChange={(val: string) => setNewRequest({ ...newRequest, type: val })}
                        options={[
                            { value: 'vacaciones', label: 'Vacaciones' },
                            { value: 'baja_medica', label: 'Baja Médica' },
                            { value: 'permiso', label: 'Permiso Retribuido' },
                            { value: 'asuntos_propios', label: 'Asuntos Propios' }
                        ]}
                        fullWidth
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Input
                            type="date"
                            label="Desde"
                            value={newRequest.startDate}
                            onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                            fullWidth
                        />
                        <Input
                            type="date"
                            label="Hasta"
                            value={newRequest.endDate}
                            onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                            fullWidth
                        />
                    </div>
                    <Input
                        label="Notas / Justificación"
                        placeholder="Comentarios adicionales..."
                        value={newRequest.notes}
                        onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                        fullWidth
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <Button variant="primary" onClick={handleSubmit}>
                            Enviar Solicitud
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

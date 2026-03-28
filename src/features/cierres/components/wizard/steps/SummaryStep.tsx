import type { FC } from 'react';
import { Card, Input, Button, Table } from '@/shared/components';
import { ArrowLeft, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { ClosingFormData } from '../types';
import { formatCurrency } from '@/utils/formatters';

interface ComparisonRow {
    concept: string;
    real: number;
    pos: number;
    isTotal?: boolean;
}

interface SummaryStepProps {
    formData: ClosingFormData;
    setFormData: (data: ClosingFormData) => void;
    onBack: () => void;
    onSave: () => void;
}

export const SummaryStep: FC<SummaryStepProps> = ({
    formData,
    setFormData,
    onBack,
    onSave
}) => {

    // Calculate totals
    const totalReal = (formData.efectivoContado + formData.totalDatafonos + formData.totalOtrosMedios + formData.totalDelivery) - (formData.propina || 0);
    const totalPos = formData.posEfectivo + formData.posTarjetas + formData.posDelivery + formData.posTickets + formData.posExtras;
    const descuadreTotal = totalReal - totalPos;

    return (
        <Card style={{ padding: 'var(--spacing-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xl)' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                    4. Resumen y Cuadre
                </h3>
                {formData.propina > 0 && (
                    <div style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', backgroundColor: 'var(--primary-lighter)', borderRadius: 'var(--radius)', fontSize: 'var(--font-size-xs)', color: 'var(--primary)', fontWeight: '600' }}>
                        Propina: {formatCurrency(formData.propina)}
                    </div>
                )}
            </div>

            {/* POS Data */}
            <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: '600' }}>
                    Datos del Z-Report (POS)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                    <Input
                        label="Efectivo"
                        type="number"
                        value={formData.posEfectivo}
                        onChange={(e) => setFormData({ ...formData, posEfectivo: parseFloat(e.target.value) || 0 })}
                        fullWidth
                    />
                    <Input
                        label="Tarjetas"
                        type="number"
                        value={formData.posTarjetas}
                        onChange={(e) => setFormData({ ...formData, posTarjetas: parseFloat(e.target.value) || 0 })}
                        fullWidth
                    />
                    <Input
                        label="Delivery"
                        type="number"
                        value={formData.posDelivery}
                        onChange={(e) => setFormData({ ...formData, posDelivery: parseFloat(e.target.value) || 0 })}
                        fullWidth
                    />
                    <Input
                        label="Extras"
                        type="number"
                        value={formData.posExtras}
                        onChange={(e) => setFormData({ ...formData, posExtras: parseFloat(e.target.value) || 0 })}
                        fullWidth
                    />
                </div>
            </div>

            {/* Comparison Table */}
            <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: '600' }}>
                    Comparativa {formData.propina > 0 && '(Neto sin propinas)'}
                </h4>
                <Table
                    data={[
                        { concept: 'Efectivo', real: formData.efectivoContado - (formData.propina || 0), pos: formData.posEfectivo },
                        { concept: 'Tarjetas', real: formData.totalDatafonos, pos: formData.posTarjetas },
                        { concept: 'Otros/Delivery', real: formData.totalOtrosMedios + formData.totalDelivery, pos: formData.posDelivery + formData.posExtras },
                        { concept: 'TOTAL', real: totalReal, pos: totalPos, isTotal: true }
                    ]}
                    columns={[
                        { key: 'concept', header: 'Concepto', render: (_v: ComparisonRow[keyof ComparisonRow], r: ComparisonRow) => <span style={{ fontWeight: r.isTotal ? 'bold' : 'normal' }}>{r.concept}</span> },
                        { key: 'real', header: 'Real', render: (_v: ComparisonRow[keyof ComparisonRow], r: ComparisonRow) => <span style={{ fontWeight: r.isTotal ? 'bold' : 'normal' }}>{formatCurrency(r.real)}</span> },
                        { key: 'pos', header: 'POS', render: (_v: ComparisonRow[keyof ComparisonRow], r: ComparisonRow) => <span style={{ fontWeight: r.isTotal ? 'bold' : 'normal' }}>{formatCurrency(r.pos)}</span> },
                        {
                            key: 'diff',
                            header: 'Dif.',
                            render: (_v: ComparisonRow[keyof ComparisonRow], r: ComparisonRow) => {
                                const diff = r.real - r.pos;
                                const color = Math.abs(diff) <= 0.05 ? 'var(--success)' : 'var(--danger)';
                                return <span style={{ color, fontWeight: 'bold' }}>{formatCurrency(diff)}</span>
                            }
                        }
                    ]}
                />
            </div>

            <div style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: Math.abs(descuadreTotal) <= 0.05 ? 'var(--success-muted)' : 'var(--danger-muted)',
                borderRadius: '8px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Math.abs(descuadreTotal) <= 0.05 ? (
                        <><CheckCircle size={24} color="var(--success)" /> <span style={{ fontWeight: '600', color: 'var(--success)', fontSize: '16px' }}>CAJA CUADRADA</span></>
                    ) : (
                        <><AlertTriangle size={24} color="var(--danger)" /> <span style={{ fontWeight: '600', color: 'var(--danger)', fontSize: '16px' }}>DESCUADRE DE {formatCurrency(descuadreTotal)}</span></>
                    )}
                </div>

                {Math.abs(descuadreTotal) > 0.05 && (
                    <div style={{ width: '100%', marginTop: '12px' }}>
                        <textarea
                            placeholder="Añade una nota explicativa sobre el descuadre..."
                            value={formData.notasDescuadre}
                            onChange={(e) => setFormData({ ...formData, notasDescuadre: e.target.value })}
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                fontSize: '14px',
                                resize: 'vertical',
                                backgroundColor: 'var(--surface)'
                            }}
                        />
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={onBack} variant="secondary">
                    <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Anterior
                </Button>
                <Button onClick={onSave} variant="primary">
                    <Save size={16} style={{ marginRight: '8px' }} /> Confirmar y Guardar
                </Button>
            </div>
        </Card>
    );
};

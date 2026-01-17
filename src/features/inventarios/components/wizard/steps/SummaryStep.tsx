import React from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { Card, Button, FormSection } from '@/shared/components';
import { InventoryFormData, ZONES } from '../../../inventory.types';
import { formatDate } from '@/utils/formatters';

interface SummaryStepProps {
    formData: InventoryFormData;
    setFormData: (data: InventoryFormData) => void;
    onSubmit: () => void;
    onBack: () => void;
    loading?: boolean;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
    formData,
    setFormData,
    onSubmit,
    onBack,
    loading
}) => {
    const productsByZone = React.useMemo(() => {
        const grouped: Record<string, string[]> = {};
        formData.productos.forEach(p => {
            if (!grouped[p.zona]) grouped[p.zona] = [];
            grouped[p.zona].push(p.nombre);
        });
        return grouped;
    }, [formData.productos]);

    return (
        <FormSection
            title="Resumen"
            description="Revisa el inventario antes de guardar"
        >
            <Card>
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                        {formData.nombre}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                        <div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Fecha</div>
                            <div style={{ fontWeight: '600' }}>{formatDate(formData.fecha)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Persona</div>
                            <div style={{ fontWeight: '600' }}>{formData.persona}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Productos</div>
                            <div style={{ fontWeight: '600' }}>{formData.productos.length}</div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>
                        Productos por Zona
                    </h4>
                    {Object.entries(productsByZone).map(([zone, names]) => (
                        <div key={zone} style={{ marginBottom: 'var(--spacing-md)' }}>
                            <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                                {ZONES.find(z => z.value === zone)?.label} ({names.length})
                            </div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                {names.join(', ')}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 'var(--spacing-md)' }}>
                    <label className="input-label">Notas (opcional)</label>
                    <textarea
                        value={formData.notas}
                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            fontSize: 'var(--font-size-base)',
                            fontFamily: 'inherit',
                            backgroundColor: 'var(--surface-muted)',
                            resize: 'vertical',
                        }}
                        placeholder="Notas adicionales..."
                    />
                </div>
            </Card>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'space-between', marginTop: 'var(--spacing-lg)' }}>
                <Button type="button" variant="secondary" onClick={onBack} disabled={loading}>
                    <ArrowLeft size={16} /> Atrás
                </Button>
                <Button type="button" variant="primary" size="lg" onClick={onSubmit} loading={loading}>
                    <Save size={16} /> Guardar Inventario
                </Button>
            </div>
        </FormSection>
    );
};

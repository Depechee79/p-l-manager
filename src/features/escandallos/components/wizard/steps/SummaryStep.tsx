import React from 'react';
import { Button, FormSection, Card } from '@shared/components';
import { ArrowLeft, Save } from 'lucide-react';
import { EscandalloFormData } from '../wizard.types';
import { formatCurrency } from '@utils/formatters';
import { EscandalloService } from '@/services/escandallo-service';

interface SummaryStepProps {
    data: EscandalloFormData;
    onPrevious: () => void;
    onSubmit: () => void;
    loading?: boolean;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
    data,
    onPrevious,
    onSubmit,
    loading = false,
}) => {
    const pvpNeto = EscandalloService.calculatePVPNeto(data.pvpConIVA, data.tipoIVA);
    const costeTotalNeto = EscandalloService.calculateCosteTotalNeto(data.ingredientes);
    const foodCost = EscandalloService.calculateFoodCost(costeTotalNeto, pvpNeto);

    return (
        <FormSection title="Resumen" description="Revisa los datos antes de guardar">
            <Card>
                <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                    {data.nombre}
                </h3>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-md)',
                        marginBottom: 'var(--spacing-lg)',
                    }}
                >
                    <div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                            PVP con IVA
                        </div>
                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                            {formatCurrency(data.pvpConIVA)} ({data.tipoIVA}%)
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                            PVP Neto
                        </div>
                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                            {formatCurrency(pvpNeto)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                            Coste Total
                        </div>
                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                            {formatCurrency(costeTotalNeto)}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                            Food Cost
                        </div>
                        <div
                            style={{
                                fontSize: 'var(--font-size-lg)',
                                fontWeight: '600',
                                color: foodCost > 35 ? 'var(--danger)' : 'var(--success)',
                            }}
                        >
                            {foodCost.toFixed(1)}%
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>
                        Ingredientes ({data.ingredientes.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        {data.ingredientes.map((ing, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: 'var(--spacing-sm)',
                                    backgroundColor: 'var(--surface-muted)',
                                    borderRadius: 'var(--radius)',
                                }}
                            >
                                <span style={{ fontSize: 'var(--font-size-sm)' }}>
                                    {ing.nombre} - {ing.cantidad} {ing.unidad}
                                </span>
                                <span style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>{formatCurrency(ing.costeTotal)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {data.descripcion && (
                    <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border)' }}>
                        <h4 style={{ marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Descripción
                        </h4>
                        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', lineHeight: 1.5 }}>{data.descripcion}</p>
                    </div>
                )}
            </Card>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'space-between', marginTop: 'var(--spacing-xl)' }}>
                <Button type="button" variant="secondary" onClick={onPrevious}>
                    <ArrowLeft size={16} /> Atrás
                </Button>
                <Button type="button" variant="primary" size="lg" onClick={onSubmit} loading={loading}>
                    <Save size={16} /> Guardar Escandallo
                </Button>
            </div>
        </FormSection>
    );
};

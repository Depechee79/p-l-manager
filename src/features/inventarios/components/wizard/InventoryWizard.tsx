
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, Button, StepIndicator } from '@/shared/components';
import { InventoryFormData, INITIAL_FORM_DATA, ProductCount, CountingMethod } from '../../inventory.types';
import { InfoStep, CountingStep, SummaryStep } from './steps';
import type { InventoryItem, Product } from '@types';
import { useDatabase } from '@core';

interface InventoryWizardProps {
    initialData?: InventoryItem | null;
    onSave: (data: InventoryFormData) => void;
    onCancel: () => void;
    loading?: boolean;
}

export const InventoryWizard: React.FC<InventoryWizardProps> = ({
    initialData,
    onSave,
    onCancel,
    loading
}) => {
    const { db } = useDatabase();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<InventoryFormData>(INITIAL_FORM_DATA);

    useEffect(() => {
        if (initialData) {
            // Convert InventoryItem to InventoryFormData
            const productos: ProductCount[] = initialData.productos.map(p => {
                const product = (db.productos as Product[])?.find(prod => prod.id === p.productoId);
                return {
                    productoId: p.productoId,
                    nombre: p.nombre,
                    zona: initialData.zona || 'bar',
                    metodo: 'total' as CountingMethod,
                    cantidadTotal: p.stockReal,
                    cantidadPack: undefined,
                    unidadesPorPack: product?.unidadesPorPack || 1,
                };
            });

            setFormData({
                fecha: initialData.fecha,
                persona: initialData.persona || '',
                nombre: initialData.nombre || '',
                zona: initialData.zona || 'bar',
                productos,
                notas: initialData.notas || '',
            });
        }
    }, [initialData, db.productos]);

    const steps = [
        { label: 'Información' },
        { label: 'Conteo' },
        { label: 'Resumen' },
    ];

    const handleNext = () => setStep(s => Math.min(s + 1, steps.length));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    return (
        <Card>
            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: '600' }}>
                    {initialData ? 'Editar Inventario' : 'Nuevo Inventario'}
                </h2>
                <Button variant="secondary" onClick={onCancel} disabled={loading}>
                    <X size={16} /> Cancelar
                </Button>
            </div>

            <StepIndicator
                steps={steps.map((s, i) => ({
                    label: s.label,
                    completed: i + 1 < step
                }))}
                currentStep={step}
            />

            <form onSubmit={(e) => e.preventDefault()}>
                {step === 1 && (
                    <InfoStep
                        formData={formData}
                        setFormData={setFormData}
                        onNext={handleNext}
                    />
                )}
                {step === 2 && (
                    <CountingStep
                        formData={formData}
                        setFormData={setFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}
                {step === 3 && (
                    <SummaryStep
                        formData={formData}
                        setFormData={setFormData}
                        onBack={handleBack}
                        onSubmit={() => onSave(formData)}
                        loading={loading}
                    />
                )}
            </form>
        </Card>
    );
};

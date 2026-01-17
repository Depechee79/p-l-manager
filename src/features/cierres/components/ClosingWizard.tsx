import React, { useState, useEffect } from 'react';
import { Card, StepIndicator } from '@/shared/components';
import { Button } from '@/shared/components';
import { X } from 'lucide-react';
import type { Cierre } from '@types';
import { ClosingFormData, INITIAL_FORM_STATE } from './wizard/types';
import { ConfigurationStep } from './wizard/steps/ConfigurationStep';
import { CashCountingStep } from './wizard/steps/CashCountingStep';
import { MethodsStep } from './wizard/steps/MethodsStep';
import { SummaryStep } from './wizard/steps/SummaryStep';

interface ClosingWizardProps {
    initialData?: Cierre | null;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
}

export const ClosingWizard: React.FC<ClosingWizardProps> = ({
    initialData,
    onSave,
    onCancel
}) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<ClosingFormData>(INITIAL_FORM_STATE);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...INITIAL_FORM_STATE,
                ...initialData,
                turno: (initialData.turno as ClosingFormData['turno']) || 'dia_completo',
                datafonos: initialData.datafonos || [],
                otrosMedios: initialData.otrosMedios || [],
                desgloseEfectivo: initialData.desgloseEfectivo || {},
                totalDelivery: initialData.realDelivery || 0,
            });
        }
    }, [initialData]);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleFinalSave = async () => {
        // Recalculate totals one last time to be safe
        // totalReal is net of tips for better P&L representation
        const totalReal = (formData.efectivoContado + formData.totalDatafonos + formData.totalOtrosMedios + formData.totalDelivery) - (formData.propina || 0);
        const totalPos = formData.posEfectivo + formData.posTarjetas + formData.posDelivery + formData.posTickets + formData.posExtras;
        const descuadreTotal = totalReal - totalPos;

        await onSave({
            ...formData,
            totalReal,
            totalPos,
            descuadreTotal,
            propina: formData.propina,
            notasDescuadre: formData.notasDescuadre,
            realDelivery: formData.totalDelivery
        });
    };

    const steps = [
        { title: 'Configuración' },
        { title: 'Efectivo' },
        { title: 'Medios' },
        { title: 'Resumen' },
    ];

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Card style={{ marginBottom: '20px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                        {initialData ? 'Editar Cierre' : 'Nuevo Cierre'}
                    </h2>
                    <Button variant="secondary" onClick={onCancel}>
                        <X size={16} /> Cancelar
                    </Button>
                </div>

                <StepIndicator
                    steps={steps.map(s => ({ label: s.title }))}
                    currentStep={step}
                />
            </Card>

            {step === 1 && (
                <ConfigurationStep
                    formData={formData}
                    setFormData={setFormData}
                    onNext={handleNext}
                />
            )}

            {step === 2 && (
                <CashCountingStep
                    formData={formData}
                    setFormData={setFormData}
                    onNext={handleNext}
                    onBack={handleBack}
                />
            )}

            {step === 3 && (
                <MethodsStep
                    formData={formData}
                    setFormData={setFormData}
                    onNext={handleNext}
                    onBack={handleBack}
                />
            )}

            {step === 4 && (
                <SummaryStep
                    formData={formData}
                    setFormData={setFormData}
                    onBack={handleBack}
                    onSave={handleFinalSave}
                />
            )}
        </div>
    );
};

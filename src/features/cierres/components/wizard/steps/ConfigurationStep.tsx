import React from 'react';
import { Card, DatePicker, Select, Button } from '@/shared/components';
import { ArrowRight } from 'lucide-react';
import { ClosingFormData } from '../types';

interface ConfigurationStepProps {
    formData: ClosingFormData;
    setFormData: (data: ClosingFormData) => void;
    onNext: () => void;
}

export const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
    formData,
    setFormData,
    onNext
}) => {
    const handleNext = () => {
        if (!formData.fecha || !formData.turno) return;
        onNext();
    };

    return (
        <Card style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 600 }}>
                1. Información del Cierre
            </h3>

            <div style={{ display: 'grid', gap: '24px', maxWidth: '400px' }}>
                <DatePicker
                    label="Fecha *"
                    value={formData.fecha}
                    onChange={(value) => setFormData({ ...formData, fecha: value })}
                    required
                    fullWidth
                />

                <Select
                    label="Turno *"
                    value={formData.turno}
                    onChange={(value) => setFormData({ ...formData, turno: value as any })}
                    required
                    options={[
                        { value: 'dia_completo', label: 'Día completo' },
                        { value: 'mediodia', label: 'Mediodía' },
                        { value: 'noche', label: 'Noche' },
                    ]}
                    fullWidth
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <Button
                        onClick={handleNext}
                        disabled={!formData.fecha || !formData.turno}
                        variant="primary"
                    >
                        Siguiente <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                    </Button>
                </div>
            </div>
        </Card>
    );
};

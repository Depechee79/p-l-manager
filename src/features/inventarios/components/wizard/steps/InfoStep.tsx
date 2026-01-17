import React from 'react';
import { User } from 'lucide-react';
import { Input, FormSection, DatePicker, Button } from '@/shared/components';
import { InventoryFormData, ZONES } from '../../../inventory.types';
import { ArrowRight } from 'lucide-react';

interface InfoStepProps {
    formData: InventoryFormData;
    setFormData: (data: InventoryFormData) => void;
    onNext: () => void;
}

export const InfoStep: React.FC<InfoStepProps> = ({ formData, setFormData, onNext }) => {
    return (
        <FormSection
            title="Información del Inventario"
            description="Introduce los datos básicos del inventario"
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
                <DatePicker
                    label="Fecha *"
                    value={formData.fecha}
                    onChange={(value) => setFormData({ ...formData, fecha: value })}
                    required
                    fullWidth
                />
                <Input
                    label="Persona *"
                    type="text"
                    placeholder="Camarero, Cocinero..."
                    value={formData.persona}
                    onChange={(e) => setFormData({ ...formData, persona: e.target.value })}
                    required
                    fullWidth
                    icon={<User size={18} />}
                    iconPosition="left"
                />
                <Input
                    label="Nombre del Inventario *"
                    type="text"
                    placeholder="Ej: Inventario Mensual"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    fullWidth
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label className="input-label">
                        Zona de Conteo * <span className="input-required">*</span>
                    </label>
                    <select
                        value={formData.zona}
                        onChange={(e) => setFormData({ ...formData, zona: e.target.value as any })}
                        style={{
                            padding: '0 16px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            fontSize: 'var(--font-size-base)',
                            backgroundColor: 'var(--surface-muted)',
                            height: '40px',
                            boxSizing: 'border-box',
                        }}
                    >
                        {ZONES.map(zone => (
                            <option key={zone.value} value={zone.value}>{zone.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
                <Button type="button" variant="primary" onClick={onNext}>
                    Siguiente <ArrowRight size={16} />
                </Button>
            </div>
        </FormSection>
    );
};

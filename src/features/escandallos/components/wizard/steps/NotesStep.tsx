import React from 'react';
import { Button, Input, FormSection } from '@shared/components';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { EscandalloFormData } from '../wizard.types';

interface NotesStepProps {
    data: EscandalloFormData;
    onChange: (updates: Partial<EscandalloFormData>) => void;
    onNext: () => void;
    onPrevious: () => void;
}

export const NotesStep: React.FC<NotesStepProps> = ({
    data,
    onChange,
    onNext,
    onPrevious,
}) => {
    return (
        <FormSection
            title="Alérgenos y Notas"
            description="Añade información adicional sobre alérgenos e instrucciones"
        >
            <Input
                label="Descripción"
                type="text"
                placeholder="Descripción del plato..."
                value={data.descripcion}
                onChange={(e) => onChange({ descripcion: e.target.value })}
                fullWidth
            />

            <div style={{ marginTop: 'var(--spacing-md)' }}>
                <label className="input-label" style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Notas / Instrucciones
                </label>
                <textarea
                    value={data.notas}
                    onChange={(e) => onChange({ notas: e.target.value })}
                    rows={6}
                    className="input-field"
                    style={{
                        width: '100%',
                        height: 'auto',
                        minHeight: '120px',
                        resize: 'vertical',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        marginTop: 'var(--spacing-xs)'
                    }}
                    placeholder="Notas sobre la preparación, instrucciones especiales..."
                />
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'space-between', marginTop: 'var(--spacing-xl)' }}>
                <Button type="button" variant="secondary" onClick={onPrevious}>
                    <ArrowLeft size={16} /> Atrás
                </Button>
                <Button type="button" variant="primary" onClick={onNext}>
                    Siguiente <ArrowRight size={16} />
                </Button>
            </div>
        </FormSection>
    );
};

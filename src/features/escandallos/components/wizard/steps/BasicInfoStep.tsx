import React from 'react';
import { Button, Input, FormSection, SelectWithAdd } from '@shared/components';
import { ArrowRight, X, Package } from 'lucide-react';
import { EscandalloFormData } from '../wizard.types';
import { CalculationSummary } from '../../CalculationSummary';
import { EscandalloService } from '@/services/escandallo-service';
import type { TipoIVA } from '@types';

interface BasicInfoStepProps {
    data: EscandalloFormData;
    onChange: (updates: Partial<EscandalloFormData>) => void;
    onNext: () => void;
    familias: { value: string; label: string }[];
    subfamilias: { value: string; label: string }[];
    onAddFamilia: () => void;
    onAddSubfamilia: () => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
    data,
    onChange,
    onNext,
    familias,
    subfamilias,
    onAddFamilia,
    onAddSubfamilia,
}) => {
    const pvpNeto = EscandalloService.calculatePVPNeto(data.pvpConIVA, data.tipoIVA);
    const costeTotalNeto = EscandalloService.calculateCosteTotalNeto(data.ingredientes);
    const foodCost = EscandalloService.calculateFoodCost(costeTotalNeto, pvpNeto);
    const margen = EscandalloService.calculateMargenBruto(foodCost);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange({ imagen: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <FormSection
            title="Información Básica"
            description="Introduce los datos principales del plato"
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--spacing-md)',
                }}
            >
                <Input
                    label="Nombre del Plato *"
                    type="text"
                    value={data.nombre}
                    onChange={(e) => onChange({ nombre: e.target.value })}
                    required
                    fullWidth
                    placeholder="Ej: Paella de Marisco"
                />
                <Input
                    label="PVP con IVA (€) *"
                    type="number"
                    step="0.01"
                    value={data.pvpConIVA}
                    onChange={(e) => onChange({ pvpConIVA: parseFloat(e.target.value) || 0 })}
                    required
                    fullWidth
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label className="input-label" style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Tipo IVA *
                    </label>
                    <select
                        value={data.tipoIVA}
                        onChange={(e) => onChange({ tipoIVA: parseInt(e.target.value) as TipoIVA })}
                        className="input-field"
                        style={{ width: '100%' }}
                    >
                        <option value={10}>10% (Restaurante)</option>
                        <option value={21}>21% (Take Away)</option>
                        <option value={4}>4% (Reducido)</option>
                        <option value={0}>0% (Exento)</option>
                    </select>
                </div>
                <SelectWithAdd
                    label="Familia"
                    value={data.familia}
                    onChange={(val) => onChange({ familia: val, subfamilia: '' })}
                    options={familias}
                    onAddNew={onAddFamilia}
                    addLabel="Añadir familia..."
                    fullWidth
                />
                {data.familia && (
                    <SelectWithAdd
                        label="Subfamilia"
                        value={data.subfamilia}
                        onChange={(val) => onChange({ subfamilia: val })}
                        options={subfamilias}
                        onAddNew={onAddSubfamilia}
                        addLabel="Añadir subfamilia..."
                        fullWidth
                    />
                )}
            </div>

            <div style={{ marginTop: 'var(--spacing-lg)' }}>
                <label className="input-label" style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Foto del Emplatado
                </label>
                <div
                    style={{
                        marginTop: 'var(--spacing-xs)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--spacing-md)',
                    }}
                >
                    {data.imagen ? (
                        <div style={{ position: 'relative', width: 'fit-content' }}>
                            <img
                                src={data.imagen}
                                alt="Emplatado"
                                style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    height: 'auto',
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid var(--border)',
                                    objectFit: 'cover',
                                }}
                            />
                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => onChange({ imagen: null })}
                                style={{
                                    position: 'absolute',
                                    top: 'var(--spacing-xs)',
                                    right: 'var(--spacing-xs)',
                                    padding: 'var(--spacing-xs)',
                                    height: 'auto',
                                    minHeight: 'auto'
                                }}
                            >
                                <X size={14} />
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                                id="imagen-upload"
                            />
                            <label htmlFor="imagen-upload">
                                <div
                                    style={{
                                        border: '2px dashed var(--border)',
                                        borderRadius: 'var(--radius)',
                                        padding: 'var(--spacing-xl)',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: 'var(--surface-muted)',
                                        transition: 'all 200ms ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent)';
                                        e.currentTarget.style.backgroundColor = 'var(--accent-lighter)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.backgroundColor = 'var(--surface-muted)';
                                    }}
                                >
                                    <Package size={32} style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }} />
                                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: 'var(--spacing-xs)' }}>
                                        Subir foto del emplatado
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                        JPG, PNG (Máx 5MB)
                                    </div>
                                </div>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <CalculationSummary
                pvpNeto={pvpNeto}
                costeTotalNeto={costeTotalNeto}
                foodCost={foodCost}
                margen={margen}
                style={{ marginTop: 'var(--spacing-lg)' }}
            />

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-xl)' }}>
                <Button type="button" variant="primary" onClick={onNext} disabled={!data.nombre}>
                    Siguiente <ArrowRight size={16} />
                </Button>
            </div>
        </FormSection>
    );
};

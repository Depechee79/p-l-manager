import React, { useState } from 'react';
import { Button, Input, FormSection } from '@shared/components';
import type { Provider } from '@types';

/**
 * ProviderFormData - Data structure for creation and edition
 */
export type ProviderFormData = Omit<Provider, 'id' | '_synced' | 'createdAt' | 'updatedAt' | 'fechaAlta' | 'fechaModificacion'>;

interface ProviderFormProps {
    initialData?: Provider | null;
    onSave: (data: ProviderFormData) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

const INITIAL_STATE: ProviderFormData = {
    nombre: '',
    cif: '',
    contacto: '',
    telefono: '',
    direccion: '',
    codigoPostal: '',
    ciudad: '',
    provincia: '',
    email: '',
    notas: '',
};

export const ProviderForm: React.FC<ProviderFormProps> = ({
    initialData,
    onSave,
    onCancel,
    loading = false,
}) => {
    const [formData, setFormData] = useState<ProviderFormData>(() => {
        if (initialData) {
            return {
                nombre: initialData.nombre || '',
                cif: initialData.cif || '',
                contacto: initialData.contacto || '',
                telefono: initialData.telefono || '',
                direccion: initialData.direccion || '',
                codigoPostal: initialData.codigoPostal || '',
                ciudad: initialData.ciudad || '',
                provincia: initialData.provincia || '',
                email: initialData.email || '',
                notas: initialData.notas || '',
            };
        }
        return INITIAL_STATE;
    });

    const handleInputChange = (field: keyof ProviderFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const isEditing = !!initialData;

    return (
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)', padding: 'var(--spacing-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-main)' }}>
                    {isEditing ? 'Editar Proveedor' : 'Crear Proveedor'}
                </h2>
                <Button variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ maxWidth: '800px' }}>
                    <FormSection
                        title="Datos Fiscales"
                        description="Información fiscal y de identificación del proveedor"
                    >
                        <Input
                            label="Nombre *"
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                            required
                            fullWidth
                            placeholder="Ej: Proveedor S.L."
                        />
                        <Input
                            label="CIF / NIF *"
                            type="text"
                            value={formData.cif}
                            onChange={(e) => handleInputChange('cif', e.target.value)}
                            required
                            fullWidth
                            placeholder="Ej: B12345678"
                        />
                    </FormSection>

                    <FormSection
                        title="Datos de Contacto"
                        description="Información de contacto directo"
                    >
                        <Input
                            label="Persona de Contacto *"
                            type="text"
                            value={formData.contacto}
                            onChange={(e) => handleInputChange('contacto', e.target.value)}
                            required
                            fullWidth
                            placeholder="Ej: Juan Pérez"
                        />
                        <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <Input
                                label="Teléfono"
                                type="tel"
                                value={formData.telefono}
                                onChange={(e) => handleInputChange('telefono', e.target.value)}
                                fullWidth
                                placeholder="Ej: 600 000 000"
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                fullWidth
                                placeholder="Ej: contacto@ejemplo.com"
                            />
                        </div>
                    </FormSection>

                    <FormSection
                        title="Ubicación"
                        description="Dirección postal del proveedor"
                    >
                        <Input
                            label="Dirección"
                            type="text"
                            value={formData.direccion}
                            onChange={(e) => handleInputChange('direccion', e.target.value)}
                            fullWidth
                            placeholder="Calle, número, piso..."
                        />
                        <div className="form-grid-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <Input
                                label="C.P."
                                type="text"
                                value={formData.codigoPostal}
                                onChange={(e) => handleInputChange('codigoPostal', e.target.value)}
                                fullWidth
                            />
                            <Input
                                label="Ciudad"
                                type="text"
                                value={formData.ciudad}
                                onChange={(e) => handleInputChange('ciudad', e.target.value)}
                                fullWidth
                            />
                            <Input
                                label="Provincia"
                                type="text"
                                value={formData.provincia}
                                onChange={(e) => handleInputChange('provincia', e.target.value)}
                                fullWidth
                            />
                        </div>
                    </FormSection>

                    <FormSection
                        title="Información Adicional"
                        description="Notas y observaciones relevantes"
                    >
                        <Input
                            label="Notas"
                            type="text"
                            value={formData.notas}
                            onChange={(e) => handleInputChange('notas', e.target.value)}
                            fullWidth
                            placeholder="Cualquier información adicional..."
                        />
                    </FormSection>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-xl)' }}>
                        <Button type="button" variant="secondary" onClick={onCancel}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={loading} variant="primary">
                            {isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

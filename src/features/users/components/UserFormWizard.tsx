import React, { useState, useEffect } from 'react';
import { Button, Input, Card, FormSection, StepIndicator } from '@components';
import { X, ArrowRight, ArrowLeft, Save } from 'lucide-react';
import type { AppUser, Role, Permission } from '../users.types';
import { PERMISSION_GROUPS } from '@shared/config';
import { useToast } from '@utils/toast';

interface UserFormData {
    nombre: string;
    email: string;
    telefono: string;
    rolId: string | number;
    activo: boolean;
    fechaCreacion: string;
    ultimoAcceso: string;
}

export interface UserFormWizardProps {
    initialData?: AppUser | null;
    roles: Role[];
    onSave: (data: UserFormData) => void;
    onCancel: () => void;
    getRoleName: (rolId: string | number) => string;
    getRolePermissions: (rolId: string | number) => Permission[];
}

const steps = [
    { label: 'Información' },
    { label: 'Rol y Permisos' },
];

export const UserFormWizard: React.FC<UserFormWizardProps> = ({
    initialData,
    roles,
    onSave,
    onCancel,
    getRoleName,
    getRolePermissions
}) => {
    const { showToast } = useToast();
    const [wizardStep, setWizardStep] = useState(1);
    const [formData, setFormData] = useState<{
        nombre: string;
        email: string;
        telefono: string;
        rolId: string | number;
        activo: boolean;
    }>({
        nombre: '',
        email: '',
        telefono: '',
        rolId: '',
        activo: true,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                nombre: initialData.nombre,
                email: initialData.email || '',
                telefono: initialData.telefono || '',
                rolId: initialData.rolId,
                activo: initialData.activo,
            });
        }
    }, [initialData]);

    const handleNextStep = () => {
        if (wizardStep === 1) {
            if (!formData.nombre || !formData.rolId) {
                showToast({
                    type: 'warning',
                    title: 'Campos requeridos',
                    message: 'Por favor completa nombre y rol',
                });
                return;
            }
        }
        if (wizardStep < steps.length) {
            setWizardStep(wizardStep + 1);
        }
    };

    const handlePreviousStep = () => {
        if (wizardStep > 1) {
            setWizardStep(wizardStep - 1);
        }
    };

    const handleSubmit = () => {
        const userData = {
            ...formData,
            fechaCreacion: initialData?.fechaCreacion || new Date().toISOString(),
            ultimoAcceso: initialData?.ultimoAcceso || new Date().toISOString(),
        };
        onSave(userData);
    };

    return (
        <Card>
            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: '600' }}>
                    {initialData ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
                <Button variant="secondary" onClick={onCancel}>
                    <X size={16} /> Cancelar
                </Button>
            </div>

            <StepIndicator
                steps={steps.map((s, i) => ({
                    label: s.label,
                    completed: i + 1 < wizardStep,
                }))}
                currentStep={wizardStep}
            />

            {/* STEP 1: Información */}
            {wizardStep === 1 && (
                <FormSection
                    title="Información del Usuario"
                    description="Introduce los datos básicos del usuario"
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
                        <Input
                            label="Nombre *"
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                            fullWidth
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            fullWidth
                        />
                        <Input
                            label="Teléfono"
                            type="tel"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            fullWidth
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                            <label className="input-label">
                                Rol * <span className="input-required">*</span>
                            </label>
                            <select
                                value={formData.rolId}
                                onChange={(e) => setFormData({ ...formData, rolId: e.target.value })}
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
                                <option value="">Seleccionar rol...</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
                        <Button type="button" variant="primary" onClick={handleNextStep}>
                            Siguiente <ArrowRight size={16} />
                        </Button>
                    </div>
                </FormSection>
            )}

            {/* STEP 2: Permisos */}
            {wizardStep === 2 && (
                <FormSection
                    title="Permisos del Usuario"
                    description="Revisa los permisos asignados según el rol"
                >
                    {formData.rolId && (
                        <Card>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <h4 style={{ marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>
                                    Rol: {getRoleName(formData.rolId)}
                                </h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    {roles.find(r => r.id === formData.rolId)?.descripcion}
                                </p>
                            </div>

                            <div style={{ marginTop: 'var(--spacing-lg)' }}>
                                <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>
                                    Permisos Asignados
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                    {PERMISSION_GROUPS.map(group => {
                                        const groupPerms = getRolePermissions(formData.rolId).filter(p =>
                                            group.permissions.includes(p)
                                        );
                                        if (groupPerms.length === 0) return null;

                                        return (
                                            <div key={group.label} style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius)' }}>
                                                <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                                                    {group.label}
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                                                    {groupPerms.map(perm => (
                                                        <span
                                                            key={perm}
                                                            className="badge badge-success"
                                                            style={{ fontSize: 'var(--font-size-xs)' }}
                                                        >
                                                            {perm.split('.').pop()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {roles.find(r => r.id === formData.rolId)?.zonasInventario && (
                                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                                    <h4 style={{ marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>
                                        Zonas de Inventario Permitidas
                                    </h4>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                                        {roles.find(r => r.id === formData.rolId)?.zonasInventario?.map(zona => (
                                            <span key={zona} className="badge badge-info" style={{ fontSize: 'var(--font-size-xs)' }}>
                                                {zona === 'bar' ? 'Barra' : zona === 'cocina' ? 'Cocina' : zona === 'camara' ? 'Cámara' : 'Almacén'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'space-between', marginTop: 'var(--spacing-lg)' }}>
                        <Button type="button" variant="secondary" onClick={handlePreviousStep}>
                            <ArrowLeft size={16} /> Atrás
                        </Button>
                        <Button type="button" variant="primary" size="lg" onClick={handleSubmit}>
                            <Save size={16} /> Guardar Usuario
                        </Button>
                    </div>
                </FormSection>
            )}
        </Card>
    );
};

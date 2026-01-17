/**
 * RestaurantConfigPage - Restaurant Management
 * 
 * Allows creating new restaurants and editing existing ones.
 * Shows list of all restaurants for selection.
 * 
 * @audit AUDIT-07 - Full restaurant CRUD
 * @rules R-01, R-02, R-04, R-13, R-UI-GLASS
 */
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, PageHeader, Select } from '@/shared/components';
import { Save, Building2, Plus, Check, X, Store, Settings, Phone, Mail, MapPin } from 'lucide-react';
import type { Restaurant, Company } from '@types';
import { useRestaurant } from '@core';

// -- Glassmorphism Styles --
const glassCardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
    borderRadius: '16px',
    overflow: 'hidden'
};

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        style={{
            padding: '12px 24px',
            border: 'none',
            background: active ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: active ? 700 : 500,
            color: active ? 'var(--primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }}
    >
        {children}
    </button>
);

export const RestaurantConfigPage: React.FC = () => {
    const {
        currentRestaurant,
        restaurants,
        currentCompany,
        updateRestaurant,
        updateCompany,
        createRestaurant,
        switchRestaurant,
        loading
    } = useRestaurant();

    const [mode, setMode] = useState<'edit' | 'create'>('edit');
    const [activeTab, setActiveTab] = useState<'restaurant' | 'group'>('restaurant');
    const [formData, setFormData] = useState<Partial<Restaurant>>({
        nombre: '',
        razonSocial: '',
        cif: '',
        direccion: '',
        telefono: '',
        email: '',
        codigo: '',
        activo: true,
        configuracion: {
            zonaHoraria: 'Europe/Madrid',
            moneda: 'EUR',
            ivaRestaurante: 10,
            ivaTakeaway: 21,
        },
    });

    const [companyFormData, setCompanyFormData] = useState<Partial<Company>>({
        nombre: '',
        razonSocial: '',
        cif: '',
        direccion: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Load current restaurant data when switching
    useEffect(() => {
        if (currentRestaurant && mode === 'edit') {
            setFormData({
                nombre: currentRestaurant.nombre || '',
                razonSocial: currentRestaurant.razonSocial || '',
                cif: currentRestaurant.cif || '',
                direccion: currentRestaurant.direccion || '',
                telefono: currentRestaurant.telefono || '',
                email: currentRestaurant.email || '',
                codigo: currentRestaurant.codigo || '',
                activo: currentRestaurant.activo ?? true,
                configuracion: currentRestaurant.configuracion || {
                    zonaHoraria: 'Europe/Madrid',
                    moneda: 'EUR',
                    ivaRestaurante: 10,
                    ivaTakeaway: 21,
                },
            });
        }
    }, [currentRestaurant, mode]);

    // Load company data
    useEffect(() => {
        if (currentCompany) {
            setCompanyFormData({
                nombre: currentCompany.nombre || '',
                razonSocial: currentCompany.razonSocial || '',
                cif: currentCompany.cif || '',
                direccion: currentCompany.direccion || '',
            });
        }
    }, [currentCompany]);

    const resetForm = () => {
        setFormData({
            nombre: '',
            razonSocial: '',
            cif: '',
            direccion: '',
            telefono: '',
            email: '',
            codigo: '',
            activo: true,
            configuracion: {
                zonaHoraria: 'Europe/Madrid',
                moneda: 'EUR',
                ivaRestaurante: 10,
                ivaTakeaway: 21,
            },
        });
    };

    const handleInputChange = (field: keyof Restaurant) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        let value = e.target.value;
        if (field === 'cif') value = value.toUpperCase();
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCompanyInputChange = (field: keyof Company) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        let value = e.target.value;
        if (field === 'cif') value = value.toUpperCase();
        setCompanyFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleConfigChange = (field: keyof Restaurant['configuracion']) => (
        e: React.ChangeEvent<HTMLInputElement> | any
    ) => {
        const value = e?.target ? (field.includes('iva') ? parseFloat(e.target.value) || 0 : e.target.value) : e;
        setFormData((prev) => ({
            ...prev,
            configuracion: { ...prev.configuracion!, [field]: value },
        }));
    };

    const handleSave = async () => {
        if (activeTab === 'restaurant' && !formData.nombre?.trim()) {
            setMessage({ type: 'error', text: 'El nombre del restaurante es obligatorio' });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        try {
            if (activeTab === 'group') {
                if (currentCompany) {
                    await updateCompany(companyFormData);
                    setMessage({ type: 'success', text: 'Datos del holding actualizados' });
                }
            } else {
                if (mode === 'create') {
                    await createRestaurant(formData as Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>);
                    setMessage({ type: 'success', text: `Restaurante "${formData.nombre}" creado correctamente` });
                    setMode('edit');
                } else {
                    await updateRestaurant(formData);
                    setMessage({ type: 'success', text: 'Configuración de unidad guardada' });
                }
            }
        } catch {
            setMessage({ type: 'error', text: 'Error al salvar los cambios' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleNewRestaurant = () => {
        setMode('create');
        setActiveTab('restaurant');
        resetForm();
        setMessage(null);
    };

    const handleCancelCreate = () => {
        setMode('edit');
        if (currentRestaurant) {
            setFormData({ ...currentRestaurant, configuracion: currentRestaurant.configuracion || formData.configuracion });
        }
        setMessage(null);
    };

    const handleSelectRestaurant = (restaurantId: string) => {
        const restaurant = restaurants.find(r => String(r.id) === restaurantId);
        if (restaurant) {
            switchRestaurant(restaurant);
            setMode('edit');
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 'var(--spacing-lg)' }}>
                <Card style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                    <div style={{ animation: 'pulse 1.5s infinite', color: 'var(--text-secondary)' }}>Cargando configuración...</div>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: 'var(--spacing-md)', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <PageHeader
                title={mode === 'create' ? 'Gestionar Nueva Unidad' : 'Configuración Corporativa'}
                description={
                    mode === 'create'
                        ? 'Vincula un nuevo punto de venta a tu holding'
                        : `Control centralizado de: ${currentCompany?.nombre || 'Holding'}`
                }
                icon={<Building2 size={28} />}
                action={
                    mode === 'edit' && (
                        <Button variant="primary" onClick={handleNewRestaurant}>
                            <Plus size={16} style={{ marginRight: '4px' }} /> Añadir Unidad
                        </Button>
                    )
                }
            />

            {/* Message Toast */}
            {message && (
                <div
                    style={{
                        padding: 'var(--spacing-md)',
                        marginBottom: 'var(--spacing-lg)',
                        borderRadius: 'var(--radius)',
                        background: message.type === 'success'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                        color: message.type === 'success' ? 'var(--success-dark)' : 'var(--danger-dark)',
                        border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        animation: 'slideDown 0.3s ease',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
                    <span style={{ fontWeight: 500 }}>{message.text}</span>
                </div>
            )}

            {/* Selector de Unidad (Premium Carousel) */}
            {mode === 'edit' && restaurants.length > 0 && (
                <section style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Store size={18} style={{ color: 'var(--primary)' }} />
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Centros Operativos</h3>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        overflowX: 'auto',
                        paddingBottom: '12px',
                        scrollbarWidth: 'none',
                    }}>
                        {restaurants.map(r => {
                            const isActive = String(currentRestaurant?.id) === String(r.id);
                            return (
                                <div
                                    key={r.id}
                                    onClick={() => handleSelectRestaurant(String(r.id))}
                                    style={{
                                        minWidth: '240px',
                                        padding: '20px',
                                        borderRadius: '16px',
                                        border: isActive ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.6)',
                                        background: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                                        backdropFilter: 'blur(8px)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        flexShrink: 0,
                                        boxShadow: isActive ? '0 8px 16px rgba(var(--primary-rgb), 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                                        transform: isActive ? 'translateY(-2px)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        fontWeight: 700,
                                        fontSize: '15px',
                                        color: isActive ? 'var(--primary)' : 'var(--text-main)',
                                        marginBottom: '6px'
                                    }}>
                                        {r.nombre}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                            {r.codigo || 'S/C'}
                                        </span>
                                        <span style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            color: r.activo ? 'var(--success)' : 'var(--text-light)',
                                            fontSize: '12px', fontWeight: 600
                                        }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                                            {r.activo ? 'ACTIVO' : 'PAUSED'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Quick Tabs Control */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(8px)',
                padding: '4px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.2)',
                width: 'fit-content'
            }}>
                <TabButton active={activeTab === 'restaurant'} onClick={() => { setActiveTab('restaurant'); setMode('edit'); }}>
                    <Store size={16} /> Unidad
                </TabButton>
                <TabButton active={activeTab === 'group'} onClick={() => setActiveTab('group')}>
                    <Building2 size={16} /> Holding / Grupo
                </TabButton>
            </div>

            {/* TAB: Group Data */}
            {activeTab === 'group' && (
                <div style={{ animation: 'fadeIn 0.4s ease' }}>
                    <Card style={{ ...glassCardStyle, padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '24px' }}>
                            <div style={{
                                padding: '12px',
                                background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--surface) 100%)',
                                borderRadius: '16px',
                                color: 'var(--primary)',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                            }}>
                                <Building2 size={32} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>Entidad Matriz</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    Datos fiscales compartidos por todas las unidades del grupo
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                            <Input
                                label="Nombre Comercial del Grupo"
                                value={companyFormData.nombre || ''}
                                onChange={handleCompanyInputChange('nombre')}
                                placeholder="Ej: Grupo Gastronómico Premium"
                                icon={<Building2 size={18} />}
                            />
                            <Input
                                label="Razón Social Holding"
                                value={companyFormData.razonSocial || ''}
                                onChange={handleCompanyInputChange('razonSocial')}
                                placeholder="Ej: Inversiones Hosteleras S.L."
                            />
                            <Input
                                label="CIF Holding"
                                value={companyFormData.cif || ''}
                                onChange={handleCompanyInputChange('cif')}
                                placeholder="Ej: B12345678"
                            />
                            <Input
                                label="Sede Central (Dirección)"
                                value={companyFormData.direccion || ''}
                                onChange={handleCompanyInputChange('direccion')}
                                placeholder="Ej: Av. de la Castellana, 100"
                                icon={<MapPin size={18} />}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            <Button variant="primary" onClick={handleSave} disabled={isSaving} size="lg" style={{ minWidth: '200px' }}>
                                <Save size={18} style={{ marginRight: '8px' }} />
                                {isSaving ? 'Guardando...' : 'Actualizar Datos Holding'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* TAB: Restaurant Data */}
            {activeTab === 'restaurant' && (mode === 'create' || currentRestaurant) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease' }}>
                    {/* General & Fiscal */}
                    <Card style={{ ...glassCardStyle, padding: '0' }}>
                        <div style={{ padding: '24px 32px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.8)', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <Store size={20} color="var(--primary)" />
                                </div>
                                Identidad de la Unidad
                            </h3>
                        </div>

                        <div style={{ padding: '32px', display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                            <Input
                                label="Nombre del Establecimiento *"
                                value={formData.nombre || ''}
                                onChange={handleInputChange('nombre')}
                                placeholder="La Taberna Real"
                                required
                                icon={<Store size={18} />}
                            />
                            <Input
                                label="Código de Centro / ID"
                                value={formData.codigo || ''}
                                onChange={handleInputChange('codigo')}
                                placeholder="MAD-01"
                            />
                            <Input
                                label="CIF Específico (si difiere)"
                                value={formData.cif || ''}
                                onChange={handleInputChange('cif')}
                                placeholder="Same as holding"
                            />
                            <Input
                                label="Teléfono de Contacto"
                                value={formData.telefono || ''}
                                onChange={handleInputChange('telefono')}
                                placeholder="+34 91..."
                                type="tel"
                                icon={<Phone size={18} />}
                            />
                            <Input
                                label="Email Operativo"
                                value={formData.email || ''}
                                onChange={handleInputChange('email')}
                                placeholder="madrid@grupo.com"
                                type="email"
                                icon={<Mail size={18} />}
                            />
                            <Input
                                label="Dirección Local"
                                value={formData.direccion || ''}
                                onChange={handleInputChange('direccion')}
                                placeholder="Calle del Pez, 14"
                                icon={<MapPin size={18} />}
                            />
                        </div>
                    </Card>

                    {/* Operational Settings */}
                    <Card style={{ ...glassCardStyle, padding: '0' }}>
                        <div style={{ padding: '24px 32px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.8)', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <Settings size={20} color="var(--primary)" />
                                </div>
                                Parámetros Operativos e Impuestos
                            </h3>
                        </div>

                        <div style={{ padding: '32px', display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                            <Input
                                label="IVA General Restaurante (%)"
                                value={formData.configuracion?.ivaRestaurante ?? 10}
                                onChange={handleConfigChange('ivaRestaurante')}
                                type="number"
                                min={0}
                                max={100}
                                inputMode="numeric"
                            />
                            <Input
                                label="IVA Takeaway / Delivery (%)"
                                value={formData.configuracion?.ivaTakeaway ?? 21}
                                onChange={handleConfigChange('ivaTakeaway')}
                                type="number"
                                min={0}
                                max={100}
                                inputMode="numeric"
                            />
                            <Select
                                label="Zona Horaria Local"
                                value={formData.configuracion?.zonaHoraria || 'Europe/Madrid'}
                                onChange={(val) => handleConfigChange('zonaHoraria')(val)}
                                options={[
                                    { value: 'Europe/Madrid', label: 'Europa/Madrid (CET)' },
                                    { value: 'Atlantic/Canary', label: 'Canarias (WET)' },
                                    { value: 'UTC', label: 'UTC' }
                                ]}
                            />
                            <Select
                                label="Divisa"
                                value={formData.configuracion?.moneda || 'EUR'}
                                onChange={(val) => handleConfigChange('moneda')(val)}
                                options={[
                                    { value: 'EUR', label: 'Euro (€)' },
                                    { value: 'USD', label: 'Dólar USA ($)' },
                                ]}
                            />
                        </div>
                    </Card>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
                        {mode === 'create' && (
                            <Button variant="secondary" onClick={handleCancelCreate} size="lg">
                                <X size={18} style={{ marginRight: '8px' }} /> Cancelar
                            </Button>
                        )}
                        <Button variant="primary" onClick={handleSave} disabled={isSaving} size="lg" style={{ minWidth: '220px', boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)' }}>
                            <Save size={18} style={{ marginRight: '8px' }} />
                            {isSaving ? 'Aplicando...' : (mode === 'create' ? 'Crear Nueva Unidad' : 'Guardar Cambios de Unidad')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantConfigPage;

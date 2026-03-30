/**
 * RestaurantConfigPage - Restaurant Management
 *
 * Session 007: Updated with design system
 * - Removed StickyPageHeader (title shown in topbar breadcrumb)
 * - Using PageLayout for sticky tabs/filters
 * - ActionHeader with tabs
 *
 * @audit AUDIT-07 - Full restaurant CRUD
 * @audit AUDIT-03 - Code generation & Hours field
 * @audit UX-EDIT - Explicit Edit/Save flow
 * @rules R-01, R-02, R-04, R-13, R-UI-GLASS
 */
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, PageLayout, ActionHeader, Modal, type Tab, Badge, Table, Switch, PageContainer } from '@/shared/components';
import { Save, Building2, Plus, Check, X, Store, Phone, Mail, MapPin, Globe, FileText, Pencil, Trash2, AlertTriangle, Settings, Shield, User2, Clock } from 'lucide-react';
import type { Restaurant, Company } from '@types';
import { useRestaurant } from '@core';
import { logger } from '@core/services/LoggerService';
// Imports adicionales
import { RolesTab, ResponsablesTab } from '@/features/config';
import { ConfigDetailLayout } from '@/shared/components/config-layout';
import { useUserPermissions } from '@/shared/hooks/useUserPermissions';

// -- Glassmorphism Styles --
const glassCardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden'
};

// Tab configuration with 16px icons
// Order: Holding → Restaurantes → Responsables → Roles
type ConfigTabId = 'group' | 'restaurants' | 'responsables' | 'roles';

const CONFIG_TABS: Tab[] = [
    { id: 'group', label: 'Holding / Grupo', icon: <Building2 size={16} /> },
    { id: 'restaurants', label: 'Restaurantes', icon: <Store size={16} /> },
    { id: 'responsables', label: 'Responsables', icon: <Settings size={16} /> },
    { id: 'roles', label: 'Roles', icon: <Shield size={16} /> },
];

export const RestaurantConfigPage: React.FC = () => {
    // Permissions hook - kept for future permission checks
    useUserPermissions();
    const {
        currentRestaurant,
        restaurants,
        currentCompany,
        updateRestaurant,
        updateCompany,
        createRestaurant,
        deleteRestaurant,
        switchRestaurant,
        loading
    } = useRestaurant();

    const [mode, setMode] = useState<'edit' | 'create'>('edit');
    const [activeTab, setActiveTab] = useState<ConfigTabId>('group');

    // UX-EDIT: Explicit edit states
    const [isEditingGroup, setIsEditingGroup] = useState(false);
    const [isEditingRestaurant, setIsEditingRestaurant] = useState(false);

    // Config UX Standardization
    const [restaurantView, setRestaurantView] = useState<'list' | 'detail'>('list');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState<Partial<Restaurant>>({
        nombre: '',
        nombreComercial: '',
        razonSocial: '',
        cif: '',
        direccion: '',
        telefono: '',
        email: '',
        codigo: '',
        activo: true,
        usaDatosFiscalesGrupo: true, // Por defecto hereda del holding
        horarios: '',
        responsableId: '',
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
        telefono: '',
        email: '',
        contactoPrincipal: '',
        web: '',
        notas: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Hoisted Actions State - MOVED UP to avoid hook error
    const [roleActions, setRoleActions] = useState<React.ReactNode>(null);

    // Load current restaurant data when switching
    useEffect(() => {
        if (currentRestaurant && mode === 'edit') {
            setFormData({
                nombre: currentRestaurant.nombre || '',
                nombreComercial: currentRestaurant.nombreComercial || '',
                razonSocial: currentRestaurant.razonSocial || '',
                cif: currentRestaurant.cif || '',
                direccion: currentRestaurant.direccion || '',
                telefono: currentRestaurant.telefono || '',
                email: currentRestaurant.email || '',
                codigo: currentRestaurant.codigo || '',
                activo: currentRestaurant.activo ?? true,
                usaDatosFiscalesGrupo: currentRestaurant.usaDatosFiscalesGrupo ?? true,
                horarios: currentRestaurant.horarios || '',
                configuracion: currentRestaurant.configuracion || {
                    zonaHoraria: 'Europe/Madrid',
                    moneda: 'EUR',
                    ivaRestaurante: 10,
                    ivaTakeaway: 21,
                },
            });
            // UX-EDIT: Reset edit mode when switching
            setIsEditingRestaurant(false);
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
                telefono: currentCompany.telefono || '',
                email: currentCompany.email || '',
                contactoPrincipal: currentCompany.contactoPrincipal || '',
                web: currentCompany.web || '',
                notas: currentCompany.notas || '',
            });
            // UX-EDIT: Reset edit mode when loading
            setIsEditingGroup(false);
        }
    }, [currentCompany]);

    const resetForm = () => {
        setFormData({
            nombre: '',
            nombreComercial: '',
            razonSocial: '',
            cif: '',
            direccion: '',
            telefono: '',
            email: '',
            codigo: '', // Se genera al guardar
            activo: true,
            usaDatosFiscalesGrupo: true,
            horarios: '',
            configuracion: {
                zonaHoraria: 'Europe/Madrid',
                moneda: 'EUR',
                ivaRestaurante: 10,
                ivaTakeaway: 21,
            },
        });
    };

    const handleInputChange = (field: keyof Restaurant) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    const handleDeleteRestaurant = async () => {
        if (!currentRestaurant?.id) return;

        setIsSaving(true);
        try {
            const success = await deleteRestaurant(String(currentRestaurant.id));
            if (success) {
                setMessage({ type: 'success', text: 'Restaurante eliminado correctamente' });
                setIsDeleteModalOpen(false);
                setMode('edit');
                setIsEditingRestaurant(false);
            } else {
                setMessage({ type: 'error', text: 'No se pudo eliminar el restaurante' });
            }
        } catch (error: unknown) {
            logger.error('Error al eliminar restaurante', error instanceof Error ? error.message : String(error));
            setMessage({ type: 'error', text: 'Error al eliminar el restaurante' });
        } finally {
            setIsSaving(false);
        }
    };

    // Tipos de IVA fijos (no editables)
    useEffect(() => {
        if (isEditingRestaurant && formData.configuracion) {
            setFormData(prev => ({
                ...prev,
                configuracion: {
                    ...prev.configuracion!,
                    ivaRestaurante: 10,
                    ivaTakeaway: 21,
                    // Eliminada zonaHoraria y moneda de la lógica activa, se mantienen en DB si existían pero no se tocan
                }
            }));
        }
    }, [isEditingRestaurant]);

    // Helper: Generate random code if missing
    const generateCode = () => {
        const bytes = crypto.getRandomValues(new Uint8Array(2));
        const num = 1000 + ((bytes[0] * 256 + bytes[1]) % 9000);
        return 'RES-' + num.toString();
    };

    const handleSave = async () => {
        if (activeTab === 'restaurants' && !formData.nombre?.trim()) {
            setMessage({ type: 'error', text: 'El nombre del restaurante es obligatorio' });
            setIsSaving(false);
            return;
        }

        setIsSaving(true);
        setMessage(null);

        try {
            if (activeTab === 'group') {
                if (currentCompany) {
                    await updateCompany(companyFormData);
                    setMessage({ type: 'success', text: 'Datos del holding actualizados' });
                    setIsEditingGroup(false); // Return to read mode
                }
            } else {
                if (mode === 'create') {
                    // AUDIT-3: Generate code if missing
                    const payload = {
                        ...formData,
                        codigo: formData.codigo || generateCode()
                    };
                    await createRestaurant(payload as Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>);
                    setMessage({ type: 'success', text: `Restaurante "${formData.nombre}" creado correctamente` });
                    setMode('edit');
                    setIsEditingRestaurant(false);
                } else {
                    await updateRestaurant(formData);
                    setMessage({ type: 'success', text: 'Configuración de unidad guardada' });
                    setIsEditingRestaurant(false); // Return to read mode
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
        setIsEditingRestaurant(true); // Create mode implies editing
        setActiveTab('restaurants');
        setRestaurantView('detail');
        resetForm();
        setMessage(null);
    };

    const handleCancelEdit = () => {
        if (activeTab === 'group') {
            setIsEditingGroup(false);
            // Revert changes
            if (currentCompany) {
                setCompanyFormData({
                    nombre: currentCompany.nombre || '',
                    razonSocial: currentCompany.razonSocial || '',
                    cif: currentCompany.cif || '',
                    direccion: currentCompany.direccion || '',
                    telefono: currentCompany.telefono || '',
                    email: currentCompany.email || '',
                    contactoPrincipal: currentCompany.contactoPrincipal || '',
                    web: currentCompany.web || '',
                    notas: currentCompany.notas || '',
                });
            }
        } else if (activeTab === 'restaurants') {
            if (mode === 'create') {
                setMode('edit');
                setIsEditingRestaurant(false);
                // Revert to current selected restaurant if any, or empty
                if (currentRestaurant) {
                    setFormData({
                        ...currentRestaurant,
                        configuracion: currentRestaurant.configuracion || formData.configuracion
                    });
                } else {
                    resetForm(); // If no restaurant was selected before creating
                }
            } else {
                setIsEditingRestaurant(false);
                // Revert changes
                if (currentRestaurant) {
                    setFormData({
                        ...currentRestaurant,
                        configuracion: currentRestaurant.configuracion || formData.configuracion
                    });
                }
            }
        }
        setMessage(null);
    };

    const handleSelectRestaurant = (restaurantId: string) => {
        const restaurant = restaurants.find(r => String(r.id) === restaurantId);
        if (restaurant) {
            switchRestaurant(restaurant);
            setMode('edit');
            setIsEditingRestaurant(false);
            setRestaurantView('detail');
        }
    };

    // Header Actions

    // List View Filtering
    const filteredRestaurants = restaurants.filter(r =>
        r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.codigo && r.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div style={{ padding: 'var(--spacing-lg)' }}>
                <Card style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                    <div style={{ animation: 'pulse 1.5s infinite', color: 'var(--text-secondary)' }}>Cargando configuración...</div>
                </Card>
            </div>
        );
    }

    // Hoisted Actions State

    return (
        <PageContainer>
            <PageLayout
                header={
                    <ActionHeader
                        tabs={CONFIG_TABS}
                        activeTab={activeTab}
                        onTabChange={(tabId) => {
                            setActiveTab(tabId as ConfigTabId);
                            // Standardize logic: entering restaurants sets mode to list
                            if (tabId === 'restaurants') {
                                setRestaurantView('list');
                                setMode('edit');
                                setIsEditingRestaurant(false);
                            }
                        }}
                        // Actions are handled internally by each tab layout
                        actions={
                            activeTab === 'group' ? (
                                isEditingGroup ? (
                                    <>
                                        <Button variant="ghost" onClick={handleCancelEdit}>
                                            <X size={18} style={{ marginRight: '8px' }} /> Cancelar
                                        </Button>
                                        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                                            <Save size={18} style={{ marginRight: '8px' }} />
                                            {isSaving ? 'Guardando...' : 'Guardar'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="secondary" onClick={() => setIsEditingGroup(true)}>
                                        <Pencil size={18} style={{ marginRight: '8px' }} /> Editar
                                    </Button>
                                )
                            ) : activeTab === 'roles' ? (
                                roleActions
                            ) : null
                        }
                    />
                }
            >
                {/* Message Toast */}
                {message && (
                    <div
                        style={{
                            padding: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-lg)',
                            borderRadius: 'var(--radius)',
                            background: message.type === 'success'
                                ? 'var(--success-light)'
                                : 'var(--danger-light)',
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

                {/* TAB: Group Data */}
                {activeTab === 'group' && (
                    <ConfigDetailLayout
                        header={null}
                    >
                        <Card style={{ ...glassCardStyle, padding: '32px', minHeight: '100%' }}>
                            {/* Grupo 1: Identidad */}
                            <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                                Identidad
                            </h4>
                            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                                <Input
                                    label="Nombre Comercial del Grupo"
                                    value={companyFormData.nombre || ''}
                                    onChange={handleCompanyInputChange('nombre')}
                                    placeholder="Ej: Grupo Gastronómico Premium"
                                    icon={<Building2 size={18} />}
                                    disabled={!isEditingGroup}
                                />
                                <Input
                                    label="Razón Social Holding"
                                    value={companyFormData.razonSocial || ''}
                                    onChange={handleCompanyInputChange('razonSocial')}
                                    placeholder="Ej: Inversiones Hosteleras S.L."
                                    disabled={!isEditingGroup}
                                />
                                <Input
                                    label="CIF Holding"
                                    value={companyFormData.cif || ''}
                                    onChange={handleCompanyInputChange('cif')}
                                    placeholder="Ej: B12345678"
                                    disabled={!isEditingGroup}
                                />
                            </div>

                            {/* Separador */}
                            <div style={{ borderBottom: '1px solid var(--border)', margin: '24px 0' }} />

                            {/* Grupo 2: Contacto */}
                            <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                                Contacto
                            </h4>
                            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                                <Input
                                    label="Sede Central (Dirección)"
                                    value={companyFormData.direccion || ''}
                                    onChange={handleCompanyInputChange('direccion')}
                                    placeholder="Ej: Av. de la Castellana, 100"
                                    icon={<MapPin size={18} />}
                                    disabled={!isEditingGroup}
                                />
                                <Input
                                    label="Teléfono Corporativo"
                                    value={companyFormData.telefono || ''}
                                    onChange={handleCompanyInputChange('telefono')}
                                    placeholder="Ej: +34 91 123 45 67"
                                    type="tel"
                                    icon={<Phone size={18} />}
                                    disabled={!isEditingGroup}
                                />
                                <Input
                                    label="Email Corporativo"
                                    value={companyFormData.email || ''}
                                    onChange={handleCompanyInputChange('email')}
                                    placeholder="Ej: info@grupo.com"
                                    type="email"
                                    icon={<Mail size={18} />}
                                    disabled={!isEditingGroup}
                                />
                                <Input
                                    label="Persona de Contacto Principal"
                                    value={companyFormData.contactoPrincipal || ''}
                                    onChange={handleCompanyInputChange('contactoPrincipal')}
                                    placeholder="Ej: Juan García"
                                    icon={<User2 size={18} />}
                                    disabled={!isEditingGroup}
                                />
                                <Input
                                    label="Web Corporativa"
                                    value={companyFormData.web || ''}
                                    onChange={handleCompanyInputChange('web')}
                                    placeholder="Ej: https://www.grupo.com"
                                    type="url"
                                    icon={<Globe size={18} />}
                                    disabled={!isEditingGroup}
                                />
                            </div>

                            {/* Separador */}
                            <div style={{ borderBottom: '1px solid var(--border)', margin: '24px 0' }} />

                            {/* Grupo 3: Notas */}
                            <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                                Notas
                            </h4>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '8px', color: 'var(--text-main)' }}>
                                    <FileText size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                    Notas / Observaciones
                                </label>
                                <textarea
                                    value={companyFormData.notas || ''}
                                    onChange={(e) => setCompanyFormData(prev => ({ ...prev, notas: e.target.value }))}
                                    placeholder="Añade notas o información adicional sobre el grupo..."
                                    disabled={!isEditingGroup}
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: 'var(--spacing-md)',
                                        fontSize: 'var(--font-size-sm)',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        background: isEditingGroup ? 'var(--surface)' : 'var(--surface-muted)',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        opacity: isEditingGroup ? 1 : 0.7,
                                        cursor: isEditingGroup ? 'text' : 'not-allowed'
                                    }}
                                />
                            </div>
                        </Card>
                    </ConfigDetailLayout>
                )}

                {/* TAB: Responsables */}
                {activeTab === 'responsables' && (
                    <ResponsablesTab />
                )}

                {/* TAB: Roles */}
                {activeTab === 'roles' && (
                    <RolesTab onRegisterActions={setRoleActions} />
                )}

                {/* TAB: Restaurant Data */}
                {activeTab === 'restaurants' && (
                    restaurantView === 'list' ? (
                        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease' }}>
                            <Card
                                style={{ flex: 1, minHeight: 0, padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                            >
                                {/* Header — responsive */}
                                <div style={{ flex: '0 0 auto', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                                    <div className="hidden md:flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ width: '300px' }}>
                                            <Input
                                                placeholder="Buscar restaurante..."
                                                icon={<Store size={18} />}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{ margin: 0 }}
                                            />
                                        </div>
                                        <Button variant="primary" icon={<Plus size={16} />} onClick={handleNewRestaurant}>
                                            Nuevo Restaurante
                                        </Button>
                                    </div>
                                    {/* Mobile header */}
                                    <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <Input
                                            placeholder="Buscar restaurante..."
                                            icon={<Store size={18} />}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            fullWidth
                                            style={{ margin: 0 }}
                                        />
                                        <Button variant="primary" icon={<Plus size={16} />} onClick={handleNewRestaurant} style={{ minHeight: '44px' }}>
                                            Nuevo Restaurante
                                        </Button>
                                    </div>
                                </div>

                                {/* Desktop Table */}
                                <div className="hidden md:flex" style={{ flex: 1, overflow: 'hidden', flexDirection: 'column' }}>
                                    <Table
                                        data={filteredRestaurants}
                                        columns={[
                                            {
                                                key: 'nombre',
                                                header: 'Nombre',
                                                render: (_, r: Restaurant) => <span style={{ fontWeight: 600 }}>{r.nombre}</span>
                                            },
                                            {
                                                key: 'codigo',
                                                header: 'Código',
                                                render: (_, r: Restaurant) => r.codigo ? <Badge variant="secondary">{r.codigo}</Badge> : <span className="text-muted">-</span>
                                            },
                                            {
                                                key: 'direccion',
                                                header: 'Dirección',
                                                render: (_, r: Restaurant) => <span className="text-secondary text-sm">{r.direccion || '-'}</span>
                                            },
                                            {
                                                key: 'activo',
                                                header: 'Estado',
                                                render: (_, r: Restaurant) => r.activo
                                                    ? <Badge variant="success" size="sm">Activo</Badge>
                                                    : <Badge variant="secondary" size="sm">Inactivo</Badge>
                                            },
                                            {
                                                key: 'actions',
                                                header: '',
                                                render: (_, r: Restaurant) => (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <Button
                                                            variant="ghost"
                                                            icon={<Pencil size={16} />}
                                                            onClick={() => handleSelectRestaurant(String(r.id))}
                                                            title="Editar"
                                                        />
                                                    </div>
                                                )
                                            }
                                        ]}
                                        emptyText="No se encontraron restaurantes"
                                        containerStyle={{ borderRadius: 0, border: 'none' }}
                                    />
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                                    {filteredRestaurants.length === 0 ? (
                                        <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No se encontraron restaurantes
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                            {filteredRestaurants.map((r: Restaurant) => (
                                                <div
                                                    key={String(r.id)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => handleSelectRestaurant(String(r.id))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            handleSelectRestaurant(String(r.id));
                                                        }
                                                    }}
                                                    style={{
                                                        background: 'var(--surface)',
                                                        borderRadius: 'var(--radius)',
                                                        padding: 'var(--spacing-md)',
                                                        border: '1px solid var(--border)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 'var(--spacing-xs)',
                                                        cursor: 'pointer',
                                                        minHeight: '44px',
                                                        transition: 'background-color 0.2s',
                                                    }}
                                                >
                                                    {/* Row 1: Name + Status */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', wordBreak: 'break-word' }}>{r.nombre}</span>
                                                        {r.activo
                                                            ? <Badge variant="success" size="sm">Activo</Badge>
                                                            : <Badge variant="secondary" size="sm">Inactivo</Badge>
                                                        }
                                                    </div>
                                                    {/* Row 2: Code + Edit */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        {r.codigo ? (
                                                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{r.codigo}</span>
                                                        ) : (
                                                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>-</span>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            icon={<Pencil size={16} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSelectRestaurant(String(r.id));
                                                            }}
                                                            title="Editar"
                                                            style={{ minHeight: '44px', minWidth: '44px' }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    ) : (
                        // DETAIL VIEW
                        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease' }}>
                            <Card
                                style={{ flex: 1, minHeight: 0, padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                            >
                                {/* Header Local Edición */}
                                <div style={{
                                    padding: '16px 24px',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'var(--surface)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '6px',
                                            background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Store size={18} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                                                {mode === 'create' ? 'Nuevo Restaurante' : (formData.nombre || 'Editar Restaurante')}
                                            </h3>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Configuración del local</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <Button variant="secondary" onClick={() => setRestaurantView('list')}>
                                            <X size={16} /> Volver
                                        </Button>

                                        {mode === 'edit' && currentRestaurant && (
                                            <Button variant="ghost" className="text-danger hover:bg-danger-light" onClick={() => setIsDeleteModalOpen(true)} disabled={isSaving}>
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                        {isEditingRestaurant ? (
                                            <>
                                                <Button variant="ghost" onClick={handleCancelEdit}>
                                                    Cancelar
                                                </Button>
                                                <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                                </Button>
                                            </>
                                        ) : (
                                            <Button variant="secondary" onClick={() => setIsEditingRestaurant(true)}>
                                                <Pencil size={16} style={{ marginRight: '8px' }} /> Editar
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--surface-muted)' }}>
                                    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {/* A. Cabecera Identificativa - Oculta, usando ConfigDetailHeader title */}

                                        {/* B. Datos Fiscales */}
                                        <Card style={{ ...glassCardStyle, padding: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <FileText size={18} className="text-secondary" />
                                                    Datos Fiscales
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '14px', color: formData.usaDatosFiscalesGrupo ? 'var(--text-main)' : 'var(--text-secondary)', fontWeight: formData.usaDatosFiscalesGrupo ? 600 : 400 }}>
                                                        {formData.usaDatosFiscalesGrupo ? 'Usando datos del Grupo' : 'Datos personalizados'}
                                                    </span>
                                                    <Switch
                                                        checked={formData.usaDatosFiscalesGrupo ?? true}
                                                        onChange={(val) => isEditingRestaurant && setFormData(prev => ({ ...prev, usaDatosFiscalesGrupo: val }))}
                                                        disabled={!isEditingRestaurant}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                                                {(() => {
                                                    const isInherited = formData.usaDatosFiscalesGrupo;
                                                    const displayCif = isInherited ? (currentCompany?.cif || '') : (formData.cif || '');
                                                    const displayRazon = isInherited ? (currentCompany?.razonSocial || '') : (formData.razonSocial || '');

                                                    return (
                                                        <>
                                                            <Input
                                                                label="Razón Social (Nombre Tax)"
                                                                value={displayRazon}
                                                                onChange={isInherited ? undefined : handleInputChange('razonSocial')}
                                                                placeholder="Nombre legal completo"
                                                                disabled={!isEditingRestaurant || isInherited}
                                                                style={isInherited ? { cursor: isEditingRestaurant ? 'not-allowed' : 'default', opacity: 0.7, background: 'var(--surface-muted)' } : {}}
                                                            />
                                                            <Input
                                                                label="NIF / CIF"
                                                                value={displayCif}
                                                                onChange={isInherited ? undefined : handleInputChange('cif')}
                                                                placeholder="B12345678"
                                                                disabled={!isEditingRestaurant || isInherited}
                                                                style={isInherited ? { cursor: isEditingRestaurant ? 'not-allowed' : 'default', opacity: 0.7, background: 'var(--surface-muted)' } : {}}
                                                            />
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </Card>

                                        {/* C. Datos Restaurante (Comerciales) */}
                                        <Card style={{ ...glassCardStyle, padding: '24px' }}>
                                            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                                                <Store size={18} className="text-secondary" />
                                                Datos Comerciales y Operativos
                                            </h3>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                                                <Input
                                                    label="Nombre del Restaurante (Interno) *"
                                                    value={formData.nombre || ''}
                                                    onChange={handleInputChange('nombre')}
                                                    placeholder="Ej: Madrid Centro"
                                                    required
                                                    disabled={!isEditingRestaurant}
                                                />
                                                <Input
                                                    label="Nombre Comercial (Público)"
                                                    value={formData.nombreComercial || ''}
                                                    onChange={handleInputChange('nombreComercial')}
                                                    placeholder="Ej: La Taberna de Madrid"
                                                    disabled={!isEditingRestaurant}
                                                />
                                                <Input
                                                    label="Dirección del Local (Física)"
                                                    value={formData.direccion || ''}
                                                    onChange={handleInputChange('direccion')}
                                                    placeholder="Calle Principal, 123"
                                                    icon={<MapPin size={18} />}
                                                    disabled={!isEditingRestaurant}
                                                    fullWidth
                                                />
                                                <Input
                                                    label="Teléfono de Reservas"
                                                    value={formData.telefono || ''}
                                                    onChange={handleInputChange('telefono')}
                                                    placeholder="+34..."
                                                    type="tel"
                                                    icon={<Phone size={18} />}
                                                    disabled={!isEditingRestaurant}
                                                />
                                                <Input
                                                    label="Email del Local"
                                                    value={formData.email || ''}
                                                    onChange={handleInputChange('email')}
                                                    placeholder="madrid@grupo.com"
                                                    type="email"
                                                    icon={<Mail size={18} />}
                                                    disabled={!isEditingRestaurant}
                                                />
                                            </div>
                                        </Card>

                                        {/* D. Configuración Operativa */}
                                        <Card style={{ ...glassCardStyle, padding: '24px' }}>
                                            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                                                <Settings size={18} className="text-secondary" />
                                                Configuración Fiscal Operativa
                                            </h3>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                                                <div style={{ opacity: 0.8 }}>
                                                    <Input
                                                        label="IVA Restaurante (Sala)"
                                                        value="10%"
                                                        onChange={() => { }}
                                                        disabled
                                                        style={{ background: 'var(--surface-muted)' }}
                                                    />
                                                </div>
                                                <div style={{ opacity: 0.8 }}>
                                                    <Input
                                                        label="IVA Take Away / Delivery"
                                                        value="21%"
                                                        onChange={() => { }}
                                                        disabled
                                                        style={{ background: 'var(--surface-muted)' }}
                                                    />
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Placeholder para futuros Horarios Complejos */}
                                        <Card style={{ ...glassCardStyle, padding: '24px', opacity: 0.7 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Clock size={18} className="text-secondary" />
                                                    Horarios
                                                </h3>
                                                <Badge variant="secondary">Próximamente: Editor Completo</Badge>
                                            </div>
                                            <Input
                                                label="Horario Texto Simple"
                                                value={formData.horarios || ''}
                                                onChange={handleInputChange('horarios')}
                                                placeholder="L-V: 09:00 - 23:00..."
                                                disabled={!isEditingRestaurant}
                                            />
                                        </Card>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )
                )}

            </PageLayout>

            {/* Modal Borrado (Fuera del layout) */}
            <Modal
                open={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Eliminar Restaurante"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDeleteRestaurant} disabled={isSaving}>
                            {isSaving ? 'Eliminando...' : 'Sí, Eliminar'}
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '16px 0' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        ¿Estás seguro de que deseas eliminar este restaurante? Esta acción no se puede deshacer y podría afectar a datos históricos.
                    </p>
                </div>
            </Modal >
        </PageContainer >
    );
};

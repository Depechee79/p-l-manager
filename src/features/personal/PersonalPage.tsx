/**
 * PersonalPage - Team Management
 *
 * Session 007: Updated with design system
 * - Removed StickyPageHeader (title shown in topbar breadcrumb)
 * - Using PageLayout for sticky tabs/filters
 * - ActionHeader with tabs
 */
import React, { useState, useMemo } from 'react';
import {
    Plus,
    Edit,
    Trash2,
    X,
    Save,
    Shield,
    Search,
    UserCheck,
    Mail,
    Users,
    Calendar,
    Clock,
    AlertOctagon,
    Palmtree,
    Receipt
} from 'lucide-react';
import { Button, Input, Select, Table, Card, FormSection, PageContainer, PageLayout, ActionHeader, FilterCard, FilterInput, FilterTextInput, type Tab } from '@shared/components';
import { useWorkers } from './hooks/useWorkers';
import { HorariosPage } from './components/HorariosPage';
import { FichajesPage } from './components/FichajesPage';
import { IncidenceLog } from './components/IncidenceLog';
import { AbsenceManager } from './components/AbsenceManager';
import { NominasTab } from './components/NominasTab';
import { useUsers } from '@/features/users';
import { useRestaurantContext, useDatabase } from '@core';
import { logger } from '@core/services/LoggerService';
import { useToast } from '@utils/toast';
import type { Worker, AppUser, TimeEntry, VacationRequest, Absence } from '@types';

type TabId = 'staff' | 'schedule' | 'time' | 'incidences' | 'vacations' | 'nominas';

// Tabs with icons (16px)
const PERSONAL_TABS: Tab[] = [
    { id: 'staff', label: 'Plantilla', icon: <Users size={16} /> },
    { id: 'schedule', label: 'Horarios', icon: <Calendar size={16} /> },
    { id: 'time', label: 'Fichajes', icon: <Clock size={16} /> },
    { id: 'incidences', label: 'Incidencias', icon: <AlertOctagon size={16} /> },
    { id: 'vacations', label: 'Vacaciones', icon: <Palmtree size={16} /> },
    { id: 'nominas', label: 'Nóminas', icon: <Receipt size={16} /> },
];

export const PersonalPage: React.FC = () => {
    const { showToast } = useToast();
    const { db } = useDatabase();
    const restaurantContext = useRestaurantContext();
    const companyId = restaurantContext.currentRestaurant?.companyId || '';

    const { workers, createWorker } = useWorkers(companyId);
    const { roles, users, createUser, updateUser, deleteUser } = useUsers(db);

    const [activeTab, setActiveTab] = useState<TabId>('staff');
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState<{
        nombre: string;
        apellidos: string;
        dni?: string;
        telefono?: string;
        email?: string;
        puesto: Worker['puesto'];
        restaurantes: string[];
        roles: string[];
        activo: boolean;
        hasAccess: boolean;
        rolId?: string | number;
    }>({
        nombre: '',
        apellidos: '',
        dni: '',
        telefono: '',
        email: '',
        puesto: 'camarero',
        restaurantes: [],
        roles: [],
        activo: true,
        hasAccess: false,
    });

    const filteredWorkers = useMemo(() => {
        let filtered = workers;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(w =>
                w.nombre.toLowerCase().includes(query) ||
                w.apellidos.toLowerCase().includes(query) ||
                w.email?.toLowerCase().includes(query) ||
                w.telefono?.includes(query)
            );
        }
        return filtered;
    }, [workers, searchQuery]);

    // AUDIT-FIX: Ensure data is loaded (R-14)
    React.useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([
                    db.ensureLoaded('workers'),
                    db.ensureLoaded('roles'),
                    db.ensureLoaded('usuarios'),
                    db.ensureLoaded('absences'),
                    db.ensureLoaded('vacation_requests')
                ]);
            } catch (error: unknown) {
                logger.error('Error loading PersonalPage data', error);
            }
        };
        loadData();
    }, [db]);

    const handleOpenForm = () => {
        setEditingWorker(null);
        setFormData({
            nombre: '',
            apellidos: '',
            dni: '',
            telefono: '',
            email: '',
            puesto: 'camarero',
            restaurantes: [restaurantContext.currentRestaurant?.id?.toString() || ''].filter(Boolean),
            roles: [],
            activo: true,
            hasAccess: false,
        });
        setViewMode('form');
    };

    const handleEdit = (worker: Worker) => {
        const user = users.find(u => u.email === worker.email);
        setEditingWorker(worker);
        setFormData({
            nombre: worker.nombre,
            apellidos: worker.apellidos,
            dni: worker.dni || '',
            telefono: worker.telefono || '',
            email: worker.email || '',
            puesto: worker.puesto,
            restaurantes: worker.restaurantes || [],
            roles: worker.roles || [],
            activo: worker.activo,
            hasAccess: !!user,
            rolId: user?.rolId,
        });
        setViewMode('form');
    };

    const handleSave = async () => {
        if (!formData.nombre || !formData.apellidos) {
            showToast({ type: 'error', title: 'Error', message: 'Nombre y apellidos son obligatorios' });
            return;
        }

        try {
            if (editingWorker) {
                showToast({ type: 'success', title: 'Actualizado', message: 'Datos guardados correctamente' });
            } else {
                createWorker({
                    nombre: formData.nombre,
                    apellidos: formData.apellidos,
                    dni: formData.dni,
                    telefono: formData.telefono,
                    email: formData.email,
                    puesto: formData.puesto,
                    restaurantes: formData.restaurantes,
                    roles: formData.roles,
                    activo: formData.activo,
                });
            }

            if (formData.hasAccess && formData.email) {
                const existingUser = users.find(u => u.email === formData.email);
                const userData: Omit<AppUser, 'id'> = {
                    nombre: `${formData.nombre} ${formData.apellidos}`,
                    email: formData.email,
                    rolId: formData.rolId || roles[0]?.id || 'viewer',
                    activo: formData.activo
                };

                if (existingUser) {
                    await updateUser(existingUser.id as number, userData);
                } else {
                    await createUser(userData);
                }
            } else if (!formData.hasAccess && formData.email) {
                const existingUser = users.find(u => u.email === formData.email);
                if (existingUser) {
                    await deleteUser(existingUser);
                }
            }

            setViewMode('list');
        } catch (error: unknown) {
            logger.error('Error saving worker', error);
            showToast({ type: 'error', title: 'Error', message: 'No se pudo guardar los cambios' });
        }
    };

    // Form mode - separate view without sticky header
    if (activeTab === 'staff' && viewMode === 'form') {
        return (
            <PageContainer>
                <Card>
                    <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                            <UserCheck size={20} />
                            {editingWorker ? 'Editar Perfil' : 'Nuevo Perfil'}
                        </h2>
                        <Button variant="secondary" onClick={() => setViewMode('list')}>
                            <X size={16} /> Cancelar
                        </Button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <FormSection title="Datos Operativos">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <Input label="Nombre *" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} fullWidth required />
                                    <Input label="Apellidos *" value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} fullWidth required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                                    <Input label="DNI" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} fullWidth />
                                    <Input label="Teléfono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} fullWidth />
                                </div>
                                <div style={{ marginTop: 'var(--spacing-md)' }}>
                                    <Select
                                        label="Puesto *"
                                        value={formData.puesto}
                                        onChange={(val) => setFormData({ ...formData, puesto: val as Worker['puesto'] })}
                                        fullWidth
                                        options={[
                                            { value: 'camarero', label: 'Camarero' },
                                            { value: 'cocinero', label: 'Cocinero' },
                                            { value: 'barman', label: 'Barman' },
                                            { value: 'gerente', label: 'Gerente' },
                                        ]}
                                    />
                                </div>
                            </FormSection>

                            <FormSection title="Asignación de Centros">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                                    {restaurantContext.restaurants.map(r => (
                                        <label key={r.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-sm)',
                                            padding: 'var(--spacing-sm) var(--spacing-md)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius)',
                                            backgroundColor: formData.restaurantes.includes(r.id.toString()) ? 'var(--primary-lighter)' : 'transparent',
                                            borderColor: formData.restaurantes.includes(r.id.toString()) ? 'var(--primary-light)' : 'var(--border)',
                                            cursor: 'pointer'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.restaurantes.includes(r.id.toString())}
                                                onChange={(e) => {
                                                    const res = e.target.checked
                                                        ? [...formData.restaurantes, r.id.toString()]
                                                        : formData.restaurantes.filter(id => id !== r.id.toString());
                                                    setFormData({ ...formData, restaurantes: res });
                                                }}
                                            />
                                            <span style={{ fontSize: 'var(--font-size-sm)' }}>{r.nombre}</span>
                                        </label>
                                    ))}
                                </div>
                            </FormSection>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <FormSection title="Acceso al Sistema">
                                <Card style={{ backgroundColor: 'var(--surface-muted)', border: '1px dashed var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600' }}>Habilitar acceso de usuario</div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Permite al trabajador entrar en la aplicación</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.hasAccess}
                                            onChange={(e) => setFormData({ ...formData, hasAccess: e.target.checked })}
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                    </div>

                                    {formData.hasAccess && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                            <Input
                                                label="Email de acceso *"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                fullWidth
                                                icon={<Mail size={16} />}
                                            />
                                            <Select
                                                label="Rol en el sistema *"
                                                value={formData.rolId?.toString() || ''}
                                                onChange={(val) => setFormData({ ...formData, rolId: val })}
                                                fullWidth
                                                options={roles.map(rol => ({ value: rol.id.toString(), label: rol.nombre }))}
                                            />
                                        </div>
                                    )}
                                </Card>
                            </FormSection>

                            <FormSection title="Estado Contratación/Ficha">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            checked={formData.activo}
                                            onChange={() => setFormData({ ...formData, activo: true })}
                                        />
                                        <span>Activo</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            checked={!formData.activo}
                                            onChange={() => setFormData({ ...formData, activo: false })}
                                        />
                                        <span>Inactivo / Baja</span>
                                    </label>
                                </div>
                            </FormSection>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-xl)', borderTop: '1px solid var(--border)', paddingTop: 'var(--spacing-lg)' }}>
                        <Button variant="secondary" onClick={() => setViewMode('list')}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSave} style={{ minWidth: '150px' }}>
                            <Save size={18} /> Guardar Persona
                        </Button>
                    </div>
                </Card>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageLayout
                header={
                    <ActionHeader
                        tabs={PERSONAL_TABS}
                        activeTab={activeTab}
                        onTabChange={(id: string) => { setActiveTab(id as TabId); setViewMode('list'); }}
                        actions={activeTab === 'staff' ? (
                            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenForm}>
                                Añadir Persona
                            </Button>
                        ) : undefined}
                    />
                }
            >
                {activeTab === 'staff' && (
                    <>
                        <FilterCard columns={1}>
                            <FilterInput label="Buscar">
                                <FilterTextInput
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Buscar por nombre, cargo o email..."
                                    icon={<Search size={14} />}
                                />
                            </FilterInput>
                        </FilterCard>

                        <Card style={{ padding: 0, overflow: 'hidden', marginTop: 'var(--spacing-md)' }}>
                            <Table
                                data={filteredWorkers}
                                columns={[
                                    {
                                        key: 'persona',
                                        header: 'Persona',
                                        render: (_, w) => (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-lighter)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                                                    fontWeight: 'bold', fontSize: 'var(--font-size-sm)'
                                                }}>
                                                    {w.nombre.charAt(0)}{w.apellidos.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{w.nombre} {w.apellidos}</div>
                                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{w.puesto.toUpperCase()}</div>
                                                </div>
                                            </div>
                                        ),
                                        sortable: true,
                                    },
                                    {
                                        key: 'acceso',
                                        header: 'Acceso App',
                                        render: (_, w) => {
                                            const user = users.find(u => u.email === w.email);
                                            return user ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: 'var(--font-size-sm)' }}>
                                                    <Shield size={14} /> {roles.find(r => r.id === user.rolId)?.nombre || 'Usuario'}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-light)', fontSize: 'var(--font-size-xs)' }}>Sin acceso</span>
                                            );
                                        }
                                    },
                                    {
                                        key: 'centros',
                                        header: 'Centros',
                                        render: (_, w) => (
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {(w.restaurantes || []).map(id => {
                                                    const r = restaurantContext.restaurants.find(res => res.id.toString() === id);
                                                    return r ? (
                                                        <span key={id} style={{
                                                            padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--secondary-lighter)',
                                                            fontSize: 'var(--font-size-xs)', fontWeight: '500'
                                                        }}>
                                                            {r.nombre}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'estado',
                                        header: 'Estado',
                                        render: (_, w) => (
                                            <span style={{
                                                color: w.activo ? 'var(--success)' : 'var(--text-light)',
                                                fontSize: '12px', fontWeight: 'bold'
                                            }}>
                                                {w.activo ? 'ACTIVO' : 'BAJA'}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'acciones',
                                        header: 'Acciones',
                                        render: (_, w) => (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <Button variant="secondary" size="sm" onClick={() => handleEdit(w)}><Edit size={14} /></Button>
                                                <Button variant="danger" size="sm" onClick={() => {
                                                    if (confirm('¿Eliminar ficha de personal?')) {
                                                        // Logic
                                                    }
                                                }}><Trash2 size={14} /></Button>
                                            </div>
                                        )
                                    }
                                ]}
                                onRowClick={handleEdit}
                                hoverable
                            />
                        </Card>
                    </>
                )}

                {activeTab === 'schedule' && <HorariosPage />}
                {activeTab === 'time' && <FichajesPage />}
                {activeTab === 'incidences' && (
                    <IncidenceLog
                        entries={db.fichajes as TimeEntry[]}
                        shifts={[]}
                        onResolveIncidence={() => showToast({ type: 'success', title: 'Incidencia resuelta', message: 'Estado actualizado correctamente' })}
                    />
                )}
                {activeTab === 'vacations' && (
                    <AbsenceManager
                        requests={db.vacation_requests as VacationRequest[]}
                        absences={db.absences as Absence[]}
                        onApprove={async (id, type) => {
                            try {
                                const collection = type === 'vacation' ? 'vacation_requests' : 'absences';
                                const updateData: Partial<VacationRequest & Absence> = { status: 'aprobado', approvedBy: restaurantContext.currentRestaurant?.id?.toString() };
                                await db.update(collection, id, updateData);
                                showToast({ type: 'success', title: 'Solicitud aprobada', message: 'Se ha notificado al empleado' });
                            } catch (error: unknown) {
                                logger.error('Error approving request', error);
                                showToast({ type: 'error', title: 'Error', message: 'No se pudo aprobar' });
                            }
                        }}
                        onReject={async (id, type, reason) => {
                            try {
                                const collection = type === 'vacation' ? 'vacation_requests' : 'absences';
                                const updateData: Partial<VacationRequest & Absence> = { status: 'rechazado', rejectionReason: reason };
                                await db.update(collection, id, updateData);
                                showToast({ type: 'info', title: 'Solicitud rechazada', message: 'Se ha notificado al empleado' });
                            } catch (error: unknown) {
                                logger.error('Error rejecting request', error);
                                showToast({ type: 'error', title: 'Error', message: 'No se pudo rechazar' });
                            }
                        }}
                        onCreateRequest={async (data) => {
                            try {
                                const collection = data.type === 'vacaciones' ? 'vacation_requests' : 'absences';
                                const workerId = workers[0]?.id || 'unknown';

                                await db.add(collection, {
                                    ...data,
                                    workerId: workerId.toString(),
                                    status: 'pendiente',
                                    requestDate: new Date().toISOString(),
                                    daysCount: data.startDate && data.endDate
                                        ? Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                                        : 0
                                } as Record<string, unknown>);
                                showToast({ type: 'success', title: 'Solicitud creada', message: 'Pendiente de aprobación' });
                            } catch (error: unknown) {
                                logger.error('Error creating absence request', error);
                                showToast({ type: 'error', title: 'Error', message: 'No se pudo crear la solicitud' });
                            }
                        }}
                    />
                )}

                {activeTab === 'nominas' && <NominasTab />}
            </PageLayout>
        </PageContainer>
    );
};

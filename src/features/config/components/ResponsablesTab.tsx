/**
 * ResponsablesTab - Listado de responsables del grupo
 *
 * Fase 4 & 6: Listado tipo tabla con filtros y edicion funcional
 * Fase Auditoria (AUDIT-1):
 * - Implementado sistema de invitaciones (Create flow)
 * - Implementado soft-delete (Desactivar usuario)
 * - Asignacion multiple de restaurantes en invitacion
 *
 * Reescrito completo: corregidos imports, tipos, error handling, APIs.
 */
import React, { useState, useEffect, useMemo } from 'react';

import { Card, ButtonV2, Table, Input, Select, Modal, FormSection, Badge, Checkbox } from '@shared/components';
import type { TableColumn } from '@shared/components';
import { Mail, MessageCircle, Edit2, Plus, User2, Check, UserX, UserCheck, Copy, ArrowLeft } from 'lucide-react';
import { useDatabase, useApp, useRestaurant, createInvitation } from '@core';
import { logger } from '@core/services/LoggerService';
import type { AppUser, Role, RoleId } from '@types';
import { useToast } from '@utils/toast';

// Roles considerados "responsables" (IDs internos de BBDD)
const RESPONSABLE_ROLES: readonly string[] = [
    'director_operaciones',
    'director_restaurante',
    'encargado',
    'jefe_cocina',
];

interface EditFormState {
    nombre: string;
    telefono: string;
    email: string;
    rolId: string;
}

interface InviteFormState {
    email: string;
    nombre: string;
    telefono: string;
    rolId: string;
    restaurantIds: string[];
}

interface InviteResultState {
    token: string;
    link: string;
}

export const ResponsablesTab: React.FC = () => {
    const { db } = useDatabase();
    const { user } = useApp();
    const { restaurants } = useRestaurant();
    const { showToast } = useToast();

    const [usuarios, setUsuarios] = useState<AppUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Edit Modal State
    const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [editForm, setEditForm] = useState<EditFormState>({
        nombre: '',
        telefono: '',
        email: '',
        rolId: '',
    });

    // Invite Modal State (AUDIT-1)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState<InviteFormState>({
        email: '',
        nombre: '',
        telefono: '',
        rolId: '',
        restaurantIds: [],
    });
    const [inviteResult, setInviteResult] = useState<InviteResultState | null>(null);

    const [isSaving, setIsSaving] = useState(false);

    // Resolve the current authenticated user's full AppUser from the database
    const currentAppUser = useMemo((): AppUser | null => {
        if (!user?.name) return null;
        const allUsers = (db.usuarios || []) as AppUser[];
        return allUsers.find((u) => u.nombre === user.name) ?? null;
    }, [user, db.usuarios]);

    // Cargar usuarios y roles
    useEffect(() => {
        const loadData = async () => {
            try {
                await db.ensureLoaded('usuarios');
                await db.ensureLoaded('roles');
                setUsuarios((db.usuarios || []) as AppUser[]);
                setRoles((db.roles || []) as Role[]);
            } catch (error: unknown) {
                logger.error('Error loading responsables:', error instanceof Error ? error.message : String(error));
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [db]);

    // Filtrar responsables
    const filteredResponsables = usuarios.filter((u: AppUser) => {
        // 1. Must have a "responsable" role
        if (!RESPONSABLE_ROLES.includes(String(u.rolId))) return false;

        // 2. Search text
        if (searchTerm && !u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !u.email?.toLowerCase().includes(searchTerm.toLowerCase())) return false;

        // 3. Role filter
        if (roleFilter !== 'all' && String(u.rolId) !== roleFilter) return false;

        return true;
    });

    // Get role name helper
    const getRolNombre = (rolId: string | number | undefined): string => {
        if (!rolId) return 'Sin rol';
        const rol = roles.find((r: Role) => String(r.id) === String(rolId));
        return rol?.nombre || String(rolId);
    };

    // Actions
    const handleEdit = (targetUser: AppUser) => {
        setSelectedUser(targetUser);
        setEditForm({
            nombre: targetUser.nombre || '',
            telefono: targetUser.telefono || '',
            email: targetUser.email || '',
            rolId: String(targetUser.rolId) || '',
        });
        setViewMode('edit');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedUser(null);
    };

    const handleSaveEdit = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            await db.update<AppUser>('usuarios', selectedUser.id, {
                nombre: editForm.nombre,
                telefono: editForm.telefono,
                email: editForm.email,
                rolId: editForm.rolId,
            });
            setViewMode('list');
            const updatedUsers = db.usuarios as AppUser[];
            setUsuarios([...updatedUsers]);
            showToast({ type: 'success', title: 'Usuario actualizado', message: 'Los datos han sido guardados.' });
        } catch (error: unknown) {
            logger.error('Error updating user:', error instanceof Error ? error.message : String(error));
            showToast({ type: 'error', title: 'Error', message: 'Error al guardar cambios.' });
        } finally {
            setIsSaving(false);
        }
    };

    // AUDIT-1: Handle User Deactivation/Activation
    const handleToggleActive = async (targetUser: AppUser) => {
        if (!confirm(`¿Estás seguro de que deseas ${targetUser.activo ? 'desactivar' : 'activar'} a este usuario?`)) return;

        try {
            await db.update<AppUser>('usuarios', String(targetUser.id), {
                activo: !targetUser.activo,
            });
            // Update local state optimistic
            setUsuarios(prev => prev.map(u => u.id === targetUser.id ? { ...u, activo: !u.activo } : u));
            showToast({
                type: 'success',
                title: targetUser.activo ? 'Usuario desactivado' : 'Usuario activado',
                message: `El acceso para ${targetUser.nombre} ha sido ${targetUser.activo ? 'revocado' : 'restaurado'}.`,
            });
        } catch (error: unknown) {
            logger.error('Error toggling user active state:', error instanceof Error ? error.message : String(error));
            showToast({ type: 'error', title: 'Error', message: 'No se pudo cambiar el estado del usuario.' });
        }
    };

    // AUDIT-1: Invitation Logic
    const handleOpenInvite = () => {
        setInviteForm({
            email: '',
            nombre: '',
            telefono: '',
            rolId: '',
            restaurantIds: [],
        });
        setInviteResult(null);
        setIsInviteModalOpen(true);
    };

    const handleGenerateInvitation = async () => {
        if (!inviteForm.email || !inviteForm.rolId || inviteForm.restaurantIds.length === 0) {
            showToast({ type: 'error', title: 'Datos incompletos', message: 'Email, Rol y al menos un Restaurante son obligatorios.' });
            return;
        }

        if (!currentAppUser?.uid) {
            showToast({ type: 'error', title: 'Error de sesión', message: 'No se detecta usuario administrador activo.' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await createInvitation(
                currentAppUser.uid,
                inviteForm.email,
                inviteForm.rolId as RoleId,
                inviteForm.restaurantIds,
                currentAppUser.companyId,
                { nombre: inviteForm.nombre, telefono: inviteForm.telefono },
            );

            if (result.success && result.invitation) {
                const link = `${window.location.origin}/registro?token=${result.invitation.token}`;
                setInviteResult({ token: result.invitation.token, link });
                showToast({ type: 'success', title: 'Invitación generada', message: 'Copia el enlace y envíalo al usuario.' });
            } else {
                throw new Error(result.error || 'Error desconocido al generar invitación');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error('Error generating invitation:', message);
            showToast({ type: 'error', title: 'Error', message: message || 'Error al generar invitación' });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRestaurantSelection = (id: string | number) => {
        const strId = String(id);
        setInviteForm(prev => {
            const exists = prev.restaurantIds.includes(strId);
            return {
                ...prev,
                restaurantIds: exists
                    ? prev.restaurantIds.filter(rid => rid !== strId)
                    : [...prev.restaurantIds, strId],
            };
        });
    };

    const handleWhatsApp = (telefono: string | undefined) => {
        if (!telefono) return;
        window.open(`https://wa.me/${telefono.replace(/\D/g, '')}`, '_blank');
    };

    const handleEmail = (email: string | undefined) => {
        if (!email) return;
        window.open(`mailto:${email}`, '_blank');
    };

    // Role filter options for the Select component
    const roleFilterOptions = [
        { value: 'all', label: 'Todos los roles' },
        ...roles
            .filter(r =>
                RESPONSABLE_ROLES.includes(String(r.id)) ||
                RESPONSABLE_ROLES.includes(r.nombre?.toLowerCase().replace(/ /g, '_')),
            )
            .map(r => ({ value: String(r.id), label: r.nombre })),
    ];

    // Role options for edit/invite selects
    const responsableRoleOptions = roles
        .filter(r => RESPONSABLE_ROLES.includes(String(r.id)) || RESPONSABLE_ROLES.includes(r.nombre?.toLowerCase().replace(/ /g, '_')))
        .map(r => ({ value: String(r.id), label: r.nombre }));

    // Table Columns
    const columns: TableColumn<AppUser>[] = [
        {
            key: 'nombre',
            header: 'Usuario',
            render: (_value: AppUser[keyof AppUser], row: AppUser) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: row.activo ? 1 : 0.5 }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: row.activo ? 'var(--primary-light)' : 'var(--surface-muted)',
                        color: row.activo ? 'var(--primary)' : 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600,
                    }}>
                        {row.nombre?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {row.nombre}
                            {!row.activo && <Badge variant="secondary" size="sm">Inactivo</Badge>}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ID: {String(row.id).slice(0, 6)}...</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'rolId',
            header: 'Rol',
            render: (rolId: AppUser[keyof AppUser]) => (
                <Badge variant="info">
                    {getRolNombre(rolId as string | number | undefined)}
                </Badge>
            ),
        },
        {
            key: 'email',
            header: 'Contacto',
            render: (_value: AppUser[keyof AppUser], row: AppUser) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                    {row.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={12} className="text-secondary" /> {row.email}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'restaurantIds',
            header: 'Restaurantes',
            render: (ids: AppUser[keyof AppUser]) => {
                const restaurantIds = ids as string[] | undefined;
                return restaurantIds?.length ? (
                    <Badge variant="secondary">{restaurantIds.length} asignados</Badge>
                ) : (
                    <span className="text-secondary text-sm">-</span>
                );
            },
        },
        {
            key: 'activo',
            header: 'Acciones',
            render: (_value: AppUser[keyof AppUser], row: AppUser) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {row.activo && (
                        <>
                            {row.telefono && (
                                <ButtonV2 variant="ghost" icon={<MessageCircle size={14} />} onClick={() => handleWhatsApp(row.telefono)} title="WhatsApp" />
                            )}
                            {row.email && (
                                <ButtonV2 variant="ghost" icon={<Mail size={14} />} onClick={() => handleEmail(row.email)} title="Email" />
                            )}
                            <ButtonV2 variant="secondary" icon={<Edit2 size={14} />} onClick={() => handleEdit(row)}>Editar</ButtonV2>
                        </>
                    )}
                    <ButtonV2
                        variant="secondary"
                        icon={row.activo ? <UserX size={14} /> : <UserCheck size={14} />}
                        onClick={() => handleToggleActive(row)}
                        title={row.activo ? 'Desactivar usuario' : 'Reactivar usuario'}
                    />
                </div>
            ),
        },
    ];

    if (loading) return <div>Cargando...</div>;

    return (
        <>
            {/* List View */}
            {viewMode === 'list' && (
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease' }}>
                    <Card
                        style={{ flex: 1, minHeight: 0, padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                    >
                        {/* Header */}
                        <div style={{ flex: '0 0 auto', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                                <div style={{ width: '300px' }}>
                                    <Input
                                        placeholder="Buscar responsable..."
                                        icon={<User2 size={18} />}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ margin: 0 }}
                                    />
                                </div>
                                <div style={{ width: '200px' }}>
                                    <Select
                                        value={roleFilter}
                                        onChange={(val) => setRoleFilter(val)}
                                        options={roleFilterOptions}
                                    />
                                </div>
                            </div>
                            <ButtonV2 variant="primary" icon={<Plus size={16} />} onClick={handleOpenInvite}>
                                Nuevo Responsable
                            </ButtonV2>
                        </div>

                        {/* Table Container */}
                        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <Table<AppUser>
                                data={filteredResponsables}
                                columns={columns}
                                emptyText="No se encontraron responsables con los filtros actuales"
                                containerStyle={{ borderRadius: 0, border: 'none' }}
                            />
                        </div>
                    </Card>
                </div>
            )}

            {/* Edit View */}
            {viewMode === 'edit' && selectedUser && (
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease' }}>
                    <Card
                        style={{ flex: 1, minHeight: 0, padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                    >
                        {/* Header Local Edicion */}
                        <div style={{
                            padding: '16px 24px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--surface)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '6px',
                                    background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <User2 size={18} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{selectedUser.nombre}</h3>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Editando responsable</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <ButtonV2
                                    variant="secondary"
                                    onClick={handleBackToList}
                                    disabled={isSaving}
                                    icon={<ArrowLeft size={16} />}
                                >
                                    Volver
                                </ButtonV2>
                                <ButtonV2
                                    variant="primary"
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                </ButtonV2>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--surface-muted)' }}>
                            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <Card style={{ padding: '24px' }}>
                                    <FormSection title="Información Personal">
                                        <Input
                                            label="Nombre Completo"
                                            value={editForm.nombre}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                                        />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                                            <Input
                                                label="Teléfono"
                                                value={editForm.telefono}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, telefono: e.target.value }))}
                                            />
                                            <Input
                                                label="Email"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                            />
                                        </div>
                                    </FormSection>

                                    <FormSection title="Rol y Permisos" style={{ marginTop: '24px' }}>
                                        <Select
                                            label="Rol Asignado"
                                            value={editForm.rolId}
                                            onChange={(val) => setEditForm(prev => ({ ...prev, rolId: val }))}
                                            options={responsableRoleOptions}
                                        />
                                    </FormSection>
                                </Card>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Invite Modal (AUDIT-1) */}
            <Modal
                open={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                title="Invitar Nuevo Responsable"
                size="md"
                footer={
                    inviteResult ? (
                        <ButtonV2 variant="primary" onClick={() => setIsInviteModalOpen(false)}>Cerrar</ButtonV2>
                    ) : (
                        <>
                            <ButtonV2 variant="ghost" onClick={() => setIsInviteModalOpen(false)}>Cancelar</ButtonV2>
                            <ButtonV2 variant="primary" onClick={handleGenerateInvitation} disabled={isSaving}>
                                {isSaving ? 'Generando...' : 'Generar Link de Registro'}
                            </ButtonV2>
                        </>
                    )
                }
            >
                {inviteResult ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                        }}>
                            <Check size={32} />
                        </div>
                        <h4 style={{ margin: '0 0 8px', fontSize: '18px' }}>¡Invitación Generada!</h4>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Comparte este enlace con el nuevo usuario para que complete su registro.
                        </p>

                        <div style={{
                            background: 'var(--surface-muted)',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center',
                            marginBottom: '16px',
                            wordBreak: 'break-all',
                        }}>
                            <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px', textAlign: 'left' }}>
                                {inviteResult.link}
                            </div>
                            <ButtonV2
                                variant="secondary"
                                icon={<Copy size={14} />}
                                onClick={() => {
                                    navigator.clipboard.writeText(inviteResult.link);
                                    showToast({ type: 'success', title: 'Copiado', message: 'Enlace copiado al portapapeles' });
                                }}
                            >
                                Copiar
                            </ButtonV2>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            * El enlace expira en 7 días y es de un solo uso.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Configura los permisos y datos iniciales. El usuario establecerá su contraseña al registrarse.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <Input
                                label="Nombre y Apellidos (Opcional)"
                                placeholder="Ej: Juan Pérez"
                                value={inviteForm.nombre}
                                onChange={(e) => setInviteForm(prev => ({ ...prev, nombre: e.target.value }))}
                            />
                            <Input
                                label="Email Corporativo *"
                                placeholder="juan@restaurante.com"
                                type="email"
                                value={inviteForm.email}
                                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <Input
                                label="Teléfono (Opcional)"
                                placeholder="+34 600..."
                                value={inviteForm.telefono}
                                onChange={(e) => setInviteForm(prev => ({ ...prev, telefono: e.target.value }))}
                            />
                            <Select
                                label="Rol Asignado *"
                                value={inviteForm.rolId}
                                onChange={(val) => setInviteForm(prev => ({ ...prev, rolId: val }))}
                                options={responsableRoleOptions}
                                required
                            />
                        </div>

                        <FormSection title="Asignación de Restaurantes *" description="Selecciona los restaurantes a los que tendrá acceso">
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '12px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '12px',
                            }}>
                                {restaurants.map(r => (
                                    <Checkbox
                                        key={String(r.id)}
                                        label={r.nombre}
                                        checked={inviteForm.restaurantIds.includes(String(r.id))}
                                        onChange={() => toggleRestaurantSelection(r.id)}
                                        style={{ padding: '4px' }}
                                    />
                                ))}
                                {restaurants.length === 0 && (
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No hay restaurantes disponibles</div>
                                )}
                            </div>
                        </FormSection>
                    </div>
                )}
            </Modal>
        </>
    );
};

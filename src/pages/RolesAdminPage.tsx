import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import {
    Card,
    Button,
    PageHeader,
    PageContainer,
    Modal,
    Input,
    FormSection,
    Checkbox,
    ConfirmDialog
} from '@shared/components';
import { Save, Shield, Lock, Plus, Trash2 } from 'lucide-react';
import { useDatabase } from '@core';
import { PERMISSION_GROUPS } from '@shared/config';
import { getAllSystemRoles } from '@shared/config/systemRoles';
import { useToast } from '@utils/toast';
import { logger } from '@core/services/LoggerService';
import type { Role, Permission } from '@types';

/**
 * RolesAdminPage - Administrar permisos de roles
 *
 * Permite ver y modificar los permisos de roles predefinidos.
 * Los cambios se persisten en la base de datos.
 */
export const RolesAdminPage: React.FC = () => {
    const { db } = useDatabase();
    const { showToast } = useToast();

    // AUDIT-FIX: Ensure data is loaded (R-14)
    useEffect(() => {
        const loadData = async () => {
            try {
                await db.ensureLoaded('roles');
            } catch (error: unknown) {
                logger.error("Error loading RolesAdminPage data", error instanceof Error ? error.message : String(error));
            }
        };
        loadData();
    }, [db]);

    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [editedPermissions, setEditedPermissions] = useState<Permission[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // New Role Modal State
    const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    // Delete Role Confirm State
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Valid system role names (canonical)
    const VALID_ROLE_NAMES = [
        'Director de Operaciones',
        'Director de Restaurante',
        'Encargado',
        'Jefe de Cocina',
        'Camarero',
        'Cocinero'
    ];

    // Load roles - filter only valid roles and de-duplicate by name
    useEffect(() => {
        const loadedRoles = (db.roles || []) as Role[];

        // Only initialize basic roles if the collection is COMPLETELY empty
        if (loadedRoles.length === 0) {
            const initialRoles = getAllSystemRoles().map(r => ({
                ...r,
                createdAt: Timestamp.now()
            } as Role));

            initialRoles.forEach(role => db.add('roles', role));
            setRoles(initialRoles);
        } else {
            // Filter to only valid role names (removes "Director", "Bartender", etc.)
            const validRoles = loadedRoles.filter(r => VALID_ROLE_NAMES.includes(r.nombre));

            // De-duplicate by name (keep first occurrence)
            const uniqueRoles = Array.from(new Map(validRoles.map(item => [item.nombre, item])).values());
            setRoles(uniqueRoles);
        }
    }, [db.roles]); // Depend only on db.roles to avoid loops

    const handleSelectRole = (role: Role) => {
        setSelectedRole(role);
        setEditedPermissions([...role.permisos]);
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return;

        // Check for duplicates (Status Quo)
        if (roles.some(r => r.nombre.toLowerCase().trim() === newRoleName.trim().toLowerCase())) {
            showToast({
                type: 'error',
                title: 'Error',
                message: `El rol "${newRoleName}" ya existe`
            });
            return;
        }

        const newRole: Omit<Role, 'id'> = {
            nombre: newRoleName.trim(),
            descripcion: 'Rol personalizado',
            permisos: [],
        };

        try {
            const created = await db.add('roles', newRole, { silent: true }) as Role;
            setRoles(prev => [...prev, created]);
            handleSelectRole(created);
            setIsNewRoleModalOpen(false);
            setNewRoleName('');

            showToast({
                type: 'success',
                title: 'Rol creado',
                message: `El rol "${created.nombre}" ha sido creado correctamente`
            });
        } catch (error: unknown) {
            logger.error('Error creando rol', error instanceof Error ? error.message : String(error));
            showToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudo crear el rol'
            });
        }
    };

    const handleDeleteRole = async () => {
        if (!roleToDelete) return;

        setIsDeleting(true);
        try {
            await db.delete('roles', roleToDelete.id);
            setRoles(prev => prev.filter(r => r.id !== roleToDelete.id));

            // If the deleted role was selected, clear selection
            if (selectedRole?.id === roleToDelete.id) {
                setSelectedRole(null);
                setEditedPermissions([]);
            }

            showToast({
                type: 'success',
                title: 'Rol eliminado',
                message: `El rol "${roleToDelete.nombre}" ha sido eliminado`
            });
        } catch (error: unknown) {
            logger.error('Error eliminando rol', error instanceof Error ? error.message : String(error));
            showToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudo eliminar el rol'
            });
        } finally {
            setIsDeleting(false);
            setRoleToDelete(null);
        }
    };

    const togglePermission = (permission: Permission) => {
        if (editedPermissions.includes(permission)) {
            setEditedPermissions(editedPermissions.filter(p => p !== permission));
        } else {
            setEditedPermissions([...editedPermissions, permission]);
        }
    };

    const handleSave = async () => {
        if (!selectedRole) return;

        setIsSaving(true);
        try {
            await db.update('roles', selectedRole.id, { permisos: editedPermissions } as Partial<Role>);

            // Update local state
            setRoles(prev => prev.map(r =>
                r.id === selectedRole.id ? { ...r, permisos: editedPermissions } : r
            ));
            setSelectedRole({ ...selectedRole, permisos: editedPermissions });

            showToast({
                type: 'success',
                title: 'Permisos guardados',
                message: `Los permisos del rol "${selectedRole.nombre}" han sido actualizados`
            });
        } catch (error: unknown) {
            logger.error('Error guardando permisos', error instanceof Error ? error.message : String(error));
            showToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron guardar los permisos'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = selectedRole &&
        JSON.stringify([...editedPermissions].sort()) !==
        JSON.stringify([...selectedRole.permisos].sort());

    return (
        <PageContainer>
            <PageHeader
                title="Administración de Roles"
                description="Configura los permisos de cada rol de equipo"
                icon={<Shield size={32} />}
                action={
                    <Button variant="primary" onClick={() => setIsNewRoleModalOpen(true)}>
                        <Plus size={16} style={{ marginRight: '8px' }} /> Nuevo Rol
                    </Button>
                }
            />

            {/* Desktop: side-by-side grid */}
            <div className="hidden md:grid" style={{
                gridTemplateColumns: 'minmax(250px, 300px) 1fr',
                gap: 'var(--spacing-lg)',
                alignItems: 'start',
                marginTop: 'var(--spacing-lg)'
            }}>
                {/* Roles List */}
                <Card style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
                            Roles Disponibles
                        </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {roles.map(role => (
                            <div
                                key={String(role.id)}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleSelectRole(role)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        handleSelectRole(role);
                                    }
                                }}
                                style={{
                                    padding: 'var(--spacing-md)',
                                    border: 'none',
                                    borderLeft: selectedRole?.id === role.id ? '4px solid var(--primary)' : '4px solid transparent',
                                    background: selectedRole?.id === role.id ? 'var(--primary-lighter)' : 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid var(--border-light)',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 'var(--font-size-sm)' }}>
                                    {role.nombre}
                                </div>
                                {!VALID_ROLE_NAMES.includes(role.nombre) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRoleToDelete(role);
                                        }}
                                        aria-label={`Eliminar rol ${role.nombre}`}
                                        style={{ padding: '4px', minWidth: 'auto' }}
                                    >
                                        <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Permissions Editor */}
                {selectedRole ? (
                    <Card style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <div>
                                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {selectedRole.nombre}
                                    <span style={{ fontSize: '12px', fontWeight: 'normal', padding: '2px 8px', borderRadius: '4px', background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
                                        ID: {selectedRole.id}
                                    </span>
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
                                    {selectedRole.descripcion}
                                </p>
                            </div>
                            {hasChanges && (
                                <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                                    <Save size={16} style={{ marginRight: '8px' }} />
                                    {isSaving ? 'Guardando...' : 'Guardar Permisos'}
                                </Button>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
                            {PERMISSION_GROUPS.map(group => (
                                <div
                                    key={group.label}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        backgroundColor: 'var(--surface-muted)',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border-light)'
                                    }}
                                >
                                    <h4 style={{
                                        fontWeight: 600,
                                        marginBottom: 'var(--spacing-sm)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-xs)',
                                        color: 'var(--text-main)',
                                        fontSize: 'var(--font-size-sm)'
                                    }}>
                                        <Lock size={14} />
                                        {group.label}
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {group.permissions.map(perm => {
                                            const isEnabled = editedPermissions.includes(perm);
                                            const permName = perm.split('.').pop() || perm;

                                            // Make labels friendlier
                                            const friendlyName = {
                                                'view': 'Ver / Acceder',
                                                'create': 'Crear registros',
                                                'edit': 'Editar / Modificar',
                                                'delete': 'Eliminar / Borrar',
                                                'export': 'Exportar datos'
                                            }[permName] || permName;

                                            return (
                                                <Checkbox
                                                    key={perm}
                                                    checked={isEnabled}
                                                    onChange={() => togglePermission(perm)}
                                                    label={friendlyName}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: 'var(--radius-sm)',
                                                        background: isEnabled ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                                        transition: 'all 0.2s',
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ) : (
                    <Card style={{ padding: 'var(--spacing-xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
                            <Shield size={32} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-main)' }}>Editor de Permisos</h3>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '300px' }}>
                            Selecciona un rol de la lista izquierda para visualizar y modificar sus permisos de acceso al sistema.
                        </p>
                    </Card>
                )}
            </div>

            {/* Mobile: stacked vertical layout */}
            <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                {/* If editing a role on mobile, show permissions */}
                {selectedRole ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        <Button variant="ghost" onClick={() => setSelectedRole(null)} style={{ alignSelf: 'flex-start' }}>
                            ← Volver a roles
                        </Button>
                        <Card style={{ padding: 'var(--spacing-md)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, margin: 0 }}>
                                    {selectedRole.nombre}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                                    {selectedRole.descripcion}
                                </p>
                                {hasChanges && (
                                    <Button variant="primary" onClick={handleSave} disabled={isSaving} style={{ alignSelf: 'stretch', minHeight: '44px' }}>
                                        <Save size={16} style={{ marginRight: '8px' }} />
                                        {isSaving ? 'Guardando...' : 'Guardar Permisos'}
                                    </Button>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                {PERMISSION_GROUPS.map(group => (
                                    <div
                                        key={group.label}
                                        style={{
                                            padding: 'var(--spacing-md)',
                                            backgroundColor: 'var(--surface-muted)',
                                            borderRadius: 'var(--radius)',
                                            border: '1px solid var(--border-light)'
                                        }}
                                    >
                                        <h4 style={{
                                            fontWeight: 600,
                                            marginBottom: 'var(--spacing-sm)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-xs)',
                                            color: 'var(--text-main)',
                                            fontSize: 'var(--font-size-sm)'
                                        }}>
                                            <Lock size={14} />
                                            {group.label}
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {group.permissions.map(perm => {
                                                const isEnabled = editedPermissions.includes(perm);
                                                const permName = perm.split('.').pop() || perm;
                                                const friendlyName = {
                                                    'view': 'Ver / Acceder',
                                                    'create': 'Crear registros',
                                                    'edit': 'Editar / Modificar',
                                                    'delete': 'Eliminar / Borrar',
                                                    'export': 'Exportar datos'
                                                }[permName] || permName;

                                                return (
                                                    <Checkbox
                                                        key={perm}
                                                        checked={isEnabled}
                                                        onChange={() => togglePermission(perm)}
                                                        label={friendlyName}
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: 'var(--radius-sm)',
                                                            background: isEnabled ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                                            transition: 'all 0.2s',
                                                            minHeight: '44px',
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                ) : (
                    /* Role cards list on mobile */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {roles.map(role => (
                            <div
                                key={String(role.id)}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleSelectRole(role)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        handleSelectRole(role);
                                    }
                                }}
                                style={{
                                    background: 'var(--surface)',
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid var(--border)',
                                    padding: 'var(--spacing-md)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--spacing-xs)',
                                    minHeight: '44px',
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 'var(--font-size-base)', wordBreak: 'break-word' }}>
                                    {role.nombre}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                    {role.permisos.length} permisos
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Crear Rol */}
            <Modal
                open={isNewRoleModalOpen}
                onClose={() => setIsNewRoleModalOpen(false)}
                title="Crear Nuevo Rol"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsNewRoleModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCreateRole}>Crear Rol</Button>
                    </>
                }
            >

                <div>
                    <p style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        Define el nombre del nuevo rol. Podrás asignar los permisos una vez creado.
                    </p>
                    <FormSection>
                        <Input
                            label="Nombre del Rol"
                            placeholder="Ej. Supervisor de Zona"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            fullWidth
                            autoFocus
                        />
                    </FormSection>
                </div>
            </Modal>

            {/* Confirm Delete Role Dialog */}
            <ConfirmDialog
                open={roleToDelete !== null}
                onClose={() => setRoleToDelete(null)}
                onConfirm={handleDeleteRole}
                title="Eliminar Rol"
                description={`¿Estás seguro de que deseas eliminar el rol "${roleToDelete?.nombre || ''}"? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar Rol"
                variant="danger"
                loading={isDeleting}
            />
        </PageContainer>
    );
};

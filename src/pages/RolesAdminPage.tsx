import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    PageHeader,
    Modal,
    Input,
    FormSection,
    Checkbox
} from '@shared/components';
import { Save, Shield, Lock, Plus } from 'lucide-react';
import { useDatabase } from '@core';
import { PERMISSION_GROUPS, PREDEFINED_ROLES } from '@shared/config';
import { useToast } from '@utils/toast';
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
            } catch (error) {
                console.error("Error loading RolesAdminPage data:", error);
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

    // Load roles
    useEffect(() => {
        const loadedRoles = (db.roles || []) as Role[];

        // Only initialize basic roles if the collection is COMPLETELY empty
        if (loadedRoles.length === 0) {
            const initialRoles = PREDEFINED_ROLES.map(r => ({
                ...r,
                id: Math.random().toString(36).substr(2, 9),
                createdAt: new Date().toISOString()
            } as Role));

            initialRoles.forEach(role => db.add('roles', role));
            setRoles(initialRoles);
        } else {
            // Strict de-duplication: Ensure we don't show duplicates by name
            const uniqueRoles = Array.from(new Map(loadedRoles.map(item => [item.nombre, item])).values());
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

        const newRole: any = {
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
        } catch (err) {
            showToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudo crear el rol'
            });
        }
    };

    const togglePermission = (permission: Permission) => {
        if (editedPermissions.includes(permission)) {
            setEditedPermissions(editedPermissions.filter(p => p !== permission));
        } else {
            setEditedPermissions([...editedPermissions, permission]);
        }
    };

    const handleSave = () => {
        if (!selectedRole) return;

        setIsSaving(true);
        try {
            (db as any).update('roles', selectedRole.id, { permisos: editedPermissions });

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
        } catch {
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
        <div style={{ padding: 'var(--spacing-md)' }}>
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

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(250px, 300px) 1fr',
                gap: 'var(--spacing-lg)',
                alignItems: 'start',
                marginTop: 'var(--spacing-lg)'
            }} className="roles-grid">
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
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 'var(--font-size-sm)' }}>
                                        {role.nombre}
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        {role.descripcion?.substring(0, 30)}...
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    background: 'var(--surface-muted)',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {role.permisos.length}
                                </div>
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
        </div>
    );
};

export default RolesAdminPage;
